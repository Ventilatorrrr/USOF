import db from "../db/db.js";

class Comment {

    static async create({ author_id, post_id, content }) {
        try {
            const result = await db.query(
                `INSERT INTO comments (post_id, author_id, content, status_comment, publish_date)
     VALUES (?, ?, ?, 'active', NOW())`,
                [post_id, author_id, content]
            );
            return result.insertId;
        } catch (err) {
            console.error("DB error in CommentModel.create:", err);
            throw err;
        }
    }

    static async createAndSync({ author_id, post_id, content, parent_id = null }) {
        try {
            const result = await db.query(
                `INSERT INTO comments (post_id, author_id, parent_id, content, status_comment, publish_date)
                 VALUES (?, ?, ?, ?, 'active', NOW())`,
                [post_id, author_id, parent_id, content]
            );

            const newId = result.insertId || (Array.isArray(result) ? result[0]?.insertId : null);

            const countRows = await db.query(
                `SELECT COUNT(*) AS total FROM comments WHERE post_id = ?`,
                [post_id]
            );

            let total = 0;
            if (Array.isArray(countRows) && countRows.length > 0) {
                total = countRows[0].total || 0;
            }

            await db.query(`UPDATE posts SET comments_count = ? WHERE id = ?`, [total, post_id]);

            const newComment = await this.getById(newId);

            return { ...newComment, total };
        } catch (err) {
            console.error("DB error in CommentModel.createAndSync:", err);
            throw err;
        }
    }

    static async getAllByPost(post_id, userId, { includeInactive = false } = {}) {
        try {
            const rows = await db.query(
                `
            SELECT
                c.id, c.post_id, c.author_id, c.parent_id,
                c.content, c.publish_date, c.likes_count, c.dislikes_count, c.status_comment, c.is_locked,
                u.login, u.profile_picture,
                pu.login AS parent_login,
                CASE
                    WHEN cl.is_like = 1 THEN TRUE
                    WHEN cl.is_like = 0 THEN FALSE
                    ELSE NULL
                END AS user_is_like
            FROM comments c
                     LEFT JOIN users u ON c.author_id = u.id
                     LEFT JOIN comments pc ON c.parent_id = pc.id
                     LEFT JOIN users pu ON pc.author_id = pu.id
                     LEFT JOIN comment_likes cl
                               ON cl.comment_id = c.id AND cl.user_id = ?
            WHERE c.post_id = ?
            ORDER BY c.likes_count ASC, c.publish_date ASC
                `,
                [userId, post_id]
            );

            const map = {};
            const roots = [];

            rows.forEach((c) => (map[c.id] = { ...c, replies: [] }));
            rows.forEach((c) => {
                if (c.parent_id && map[c.parent_id]) {
                    map[c.parent_id].replies.push(map[c.id]);
                } else {
                    roots.push(map[c.id]);
                }
            });

            const visibleComments = roots;

            const [countRows] = await db.query(
                `SELECT COUNT(*) AS total FROM comments WHERE post_id = ?`,
                [post_id]
            );
            const total = countRows?.total ?? 0;

            return { comments: visibleComments, total };
        } catch (err) {
            console.error("DB error in CommentModel.getAllByPost:", err.stack || err);
            throw err;
        }
    }

    static async getById(comment_id) {
        const rows = await db.query(
            `SELECT c.*, u.login
             FROM comments c
             JOIN users u ON c.author_id = u.id
             WHERE c.id = ?`,
            [comment_id]
        );
        return rows[0] || null;
    }

    static async updateStatus(comment_id, new_status) {
        await db.query(
            `UPDATE comments SET status_comment = ? WHERE id = ?`,
            [new_status, comment_id]
        );
    }

    static async delete(commentId, role = "user") {

        await db.query(`DELETE FROM comment_likes WHERE comment_id = ?`, [commentId]);

        await db.query(`DELETE FROM reports WHERE comment_id = ?`, [commentId]);

        await db.query(`
        DELETE cl FROM comment_likes cl
        JOIN comments c ON cl.comment_id = c.id
        WHERE c.parent_id = ?
    `, [commentId]);

        await db.query(`DELETE FROM reports WHERE comment_id IN (SELECT id FROM comments WHERE parent_id = ?)`, [commentId]);

        await db.query(`DELETE FROM comments WHERE parent_id = ?`, [commentId]);

        if (role === "admin") {
            await db.query(`DELETE FROM comments WHERE id = ?`, [commentId]);
        } else {
            await db.query(`DELETE FROM comments WHERE id = ?`, [commentId]);
        }
    }

    static async addReport(userId, commentId, reason) {
        return db.query(
            "INSERT IGNORE INTO reports (user_id, comment_id, reason) VALUES (?, ?, ?)",
            [userId, commentId, reason]
        );
    }

    static async getReportCount(commentId) {
        const rows = await db.query(
            "SELECT COUNT(DISTINCT user_id) as count FROM reports WHERE comment_id = ?",
            [commentId]
        );
        return rows[0]?.count || 0;
    }

    static async lock(commentId) {
        await db.query(`UPDATE comments SET is_locked = 1 WHERE id = ?`, [commentId]);
    }

    static async unlock(commentId) {
        await db.query(`UPDATE comments SET is_locked = 0 WHERE id = ?`, [commentId]);
    }

}

export default Comment;