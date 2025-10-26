import db from "../db/db.js";

class Like {
    static async togglePostLike({ post_id, user_id, is_like }) {
        if (typeof is_like !== "boolean") {
            throw new Error("is_like must be boolean");
        }

        const [rows] = await db.query(
            `SELECT is_like FROM post_likes WHERE post_id = ? AND user_id = ?`,
            [post_id, user_id]
        );

        const existing = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        if (existing.length > 0) {
            const prev = existing[0].is_like;

            if (prev === (is_like ? 1 : 0)) {
                await db.query(
                    `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
                    [post_id, user_id]
                );
            } else {

                await db.query(
                    `UPDATE post_likes SET is_like = ? WHERE post_id = ? AND user_id = ?`,
                    [is_like ? 1 : 0, post_id, user_id]
                );
            }
        } else {

            await db.query(
                `INSERT INTO post_likes (post_id, user_id, is_like) VALUES (?, ?, ?)`,
                [post_id, user_id, is_like ? 1 : 0]
            );
        }

        return this.getPostLikeCounts(post_id);
    }

    static async toggleCommentLike({ comment_id, user_id, is_like }) {
        try {

            if (typeof is_like !== "boolean") {
                return { success: false, likes: 0, dislikes: 0, is_like: null };
            }

            const existing = await db.query(
                `SELECT is_like FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
                [comment_id, user_id]
            );

            const existingRows = Array.isArray(existing) ? existing : [existing];
            if (existingRows.length && existingRows[0]?.is_like === (is_like ? 1 : 0)) {

                await db.query(
                    `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
                    [comment_id, user_id]
                );
                is_like = null;
            } else {

                await db.query(
                    `INSERT INTO comment_likes (comment_id, user_id, is_like)
                     VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                                              is_like = VALUES(is_like),
                                              publish_date = CURRENT_TIMESTAMP`,
                    [comment_id, user_id, is_like ? 1 : 0]
                );
            }

            const countRows = await db.query(
                `SELECT
                SUM(is_like = 1) AS likes,
                SUM(is_like = 0) AS dislikes
             FROM comment_likes
             WHERE comment_id = ?`,
                [comment_id]
            );

            const counts = Array.isArray(countRows) ? countRows[0] : countRows;

            await db.query(
                `UPDATE comments
                 SET likes_count = ?, dislikes_count = ?
                 WHERE id = ?`,
                [counts.likes || 0, counts.dislikes || 0, comment_id]
            );

            return {
                success: true,
                likes: Number(counts.likes) || 0,
                dislikes: Number(counts.dislikes) || 0,
                is_like
            };
        } catch (err) {
            console.error("toggleCommentLike ERROR:", err);
            throw err;
        }
    }

    static async getCommentLikes(comment_id) {
        const [rows] = await db.query(
            `SELECT cl.*, u.login
             FROM comment_likes cl
             JOIN users u ON cl.user_id = u.id
             WHERE cl.comment_id = ?
             ORDER BY cl.id ASC`,
            [comment_id]
        );
        return rows;
    }

    static async removePostLike(post_id, user_id) {
        const [existing] = await db.query(
            `SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?`,
            [post_id, user_id]
        );
        if (!existing || existing.length === 0) return null;

        await db.query(
            `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
            [post_id, user_id]
        );
        return this.getPostLikeCounts(post_id);
    }

    static async deleteCommentLike(comment_id, user_id) {
        const result = await db.query(
            `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
            [comment_id, user_id]
        );

        await db.query(`
        UPDATE comments
        SET 
            likes_count = (
                SELECT COUNT(*) 
                FROM comment_likes 
                WHERE comment_id = ? AND is_like = TRUE
            ),
            dislikes_count = (
                SELECT COUNT(*) 
                FROM comment_likes 
                WHERE comment_id = ? AND is_like = FALSE
            )
        WHERE id = ?;
    `, [comment_id, comment_id, comment_id]);

        return result;
    }

    static async getPostLikeCounts(post_id) {
        const result = await db.query(`
            SELECT
                SUM(CASE WHEN CAST(is_like AS SIGNED) = 1 THEN 1 ELSE 0 END) AS likes,
                SUM(CASE WHEN CAST(is_like AS SIGNED) = 0 THEN 1 ELSE 0 END) AS dislikes
            FROM post_likes
            WHERE post_id = ?
        `, [post_id]);

        const rows = Array.isArray(result[0]) ? result[0] : result;
        const data = rows[0] || {};

        const likes = Number(data.likes) || 0;
        const dislikes = Number(data.dislikes) || 0;

        return { likes, dislikes };
    }

    static async getCommentLikeCounts(comment_id) {
        const [rows] = await db.query(
            `SELECT 
                SUM(CASE WHEN CAST(is_like AS SIGNED) = 1 THEN 1 ELSE 0 END) AS likes,
                SUM(CASE WHEN CAST(is_like AS SIGNED) = 0 THEN 1 ELSE 0 END) AS dislikes
             FROM comment_likes
             WHERE comment_id = ?`,
            [comment_id]
        );

        const data = rows || {};
        return {
            likes: Number(data.likes) || 0,
            dislikes: Number(data.dislikes) || 0,
        };
    }

    static async removeCommentLike(comment_id, user_id) {
        await db.query(
            `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
            [comment_id, user_id]
        );

        return await Like.getCommentLikeCounts(comment_id);
    }

}

export default Like;
