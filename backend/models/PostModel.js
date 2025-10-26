// models/Post.js
import db from "../db/db.js";
import Like from "../models/LikeModel.js";
import jwt from "jsonwebtoken";

class Post {
    static async create({ author_id, title, content, categories = [] }) {
        const res = await db.query(
            `INSERT INTO posts (author_id, title, content, publish_date) VALUES (?, ?, ?, NOW())`,
            [author_id, title, content]
        );
        const postId = res.insertId;

        if (Array.isArray(categories) && categories.length) {
            await this.setCategories(postId, categories);
        }
        return postId;
    }

    static async countAllPosts(filters = {}, isAdmin = false) {
        let where = isAdmin ? "WHERE 1=1" : "WHERE p.status_post = 'active'";
        const params = [];

        if (filters.authorId && !isNaN(filters.authorId)) {
            where += " AND p.author_id = ?";
            params.push(filters.authorId);
        }

        if (filters.categoryId && filters.categoryId !== "undefined") {
            const ids = String(filters.categoryId)
                .split(",")
                .map(Number)
                .filter(id => !isNaN(id));
            if (ids.length > 0) {
                where += ` AND EXISTS (
                SELECT 1 FROM post_categories pc
                WHERE pc.post_id = p.id
                  AND pc.category_id IN (${ids.map(() => '?').join(',')})
            )`;
                params.push(...ids);
            }
        }

        if (filters.fromDate && filters.fromDate !== "undefined") {
            where += " AND p.publish_date >= ?";
            params.push(filters.fromDate);
        }

        if (filters.toDate && filters.toDate !== "undefined") {
            where += " AND p.publish_date < DATE_ADD(?, INTERVAL 1 DAY)";
            params.push(filters.toDate);
        }

        if (isAdmin && filters.status && filters.status !== "undefined") {
            where += " AND p.status_post = ?";
            params.push(filters.status);
        }

        const sql = `
            SELECT COUNT(*) AS count
            FROM posts p
                ${where};
        `;

        const result = await db.query(sql, params);
        const rows = Array.isArray(result[0]) ? result[0] : result;

        return rows?.[0]?.count || 0;
    }

    static async findById(postId, { includeInactive = false } = {}) {
        const rows = await db.query(
            `SELECT p.*,
                    u.id AS author_id,
                    u.login AS author_login,
                    u.profile_picture AS author_avatar
             FROM posts p
                      JOIN users u ON u.id = p.author_id
             WHERE p.id = ? ${includeInactive ? '' : "AND p.status_post = 'active'"}
         LIMIT 1`,
            [postId]
        );
        const post = rows[0];
        if (!post) return null;

        const counts = await Like.getPostLikeCounts(postId);
        post.likes_count = counts.likes;
        post.dislikes_count = counts.dislikes;
        post.categories = await this.getCategories(post.id);

        post.author = {
            id: post.author_id,
            login: post.author_login,
            avatar: post.author_avatar
        };

        delete post.author_login;
        delete post.author_avatar;

        return post;
    }

    static async findVisibleForUser(
        userId,
        { page = 1, limit = 20, filters = {}, sort = "likes" } = {}
    ) {
        const _userId = Number(userId) || 0;
        const _page = Number(page) || 1;
        const _limit = Number(limit) || 20;
        const offset = (_page - 1) * _limit;

        let where = "(p.status_post = 'active' OR p.author_id = ?)";
        const params = [_userId];

        if (filters.authorId) {
            where += " AND p.author_id = ?";
            params.push(Number(filters.authorId));
        }

        if (filters.categoryId) {
            const categoryIds = String(filters.categoryId)
                .split(",")
                .map((id) => Number(id))
                .filter((id) => !isNaN(id));

            if (categoryIds.length > 0) {
                where += ` AND EXISTS (
                SELECT 1 FROM post_categories pc
                WHERE pc.post_id = p.id
                AND pc.category_id IN (${categoryIds.map(() => "?").join(",")})
            )`;
                params.push(...categoryIds);
            }
        }

        if (filters.fromDate) {
            where += " AND p.publish_date >= ?";
            params.push(filters.fromDate);
        }
        if (filters.toDate) {
            where += " AND p.publish_date < DATE_ADD(?, INTERVAL 1 DAY)";
            params.push(filters.toDate);
        }

        if (filters.favorited_by) {
            where += ` AND EXISTS (
            SELECT 1 FROM post_favorites pf2
            WHERE pf2.post_id = p.id
            AND pf2.user_id = ?
        )`;
            params.push(Number(filters.favorited_by));
        }

        const orderBy =
            sort === "date"
                ? "p.publish_date DESC"
                : "COALESCE(plc.likes_count, 0) DESC";

        const sql = `
            SELECT
                p.*,
                u.login AS author_login,
                u.profile_picture AS author_avatar,
                COALESCE(plc.likes_count, 0)    AS likes_count,
                COALESCE(plc.dislikes_count, 0) AS dislikes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
                pl.is_like AS user_is_like,
                (pf.user_id IS NOT NULL) AS user_fav
            FROM posts p
                     JOIN users u ON u.id = p.author_id

                
                     LEFT JOIN (
                SELECT post_id,
                       SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END) AS likes_count,
                       SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END) AS dislikes_count
                FROM post_likes
                GROUP BY post_id
            ) plc ON plc.post_id = p.id

          
                     LEFT JOIN post_likes pl
                               ON pl.post_id = p.id AND pl.user_id = ?

               
                     LEFT JOIN post_favorites pf
                               ON pf.post_id = p.id AND pf.user_id = ?

            WHERE ${where}
            ORDER BY ${orderBy}
                LIMIT ? OFFSET ?
        `;


        const rows = await db.query(sql, [
            _userId,
            _userId,
            ...params,
            _limit,
            Number(offset),
        ]);

        for (const r of rows) {
            try {
                r.categories = await this.getCategories(r.id);
            } catch {
                r.categories = [];
            }

            r.author = {
                id: r.author_id,
                login: r.author_login,
                avatar: r.author_avatar,
            };

            r.is_liked = r.user_is_like === 1;
            r.is_disliked = r.user_is_like === 0;
            r.is_favorite = !!r.user_fav;

            delete r.author_login;
            delete r.author_avatar;
            delete r.user_is_like;
            delete r.user_fav;
        }

        return rows;
    }

    static async getUserFromToken(header) {
        try {
            if (!header || !header.startsWith("Bearer ")) return null;

            const token = header.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [user] = await db.query(
                "SELECT id, login, role FROM users WHERE id = ?",
                [decoded.id]
            );

            return user || null;
        } catch (err) {
            console.warn("Token invalid or missing:", err.message);
            return null;
        }
    }

    static async findAllForAdmin({ page = 1, limit = 50, filters = {}, sort = 'date', userId = 0 } = {}) {
        const offset = (page - 1) * limit;
        let where = "WHERE 1=1";
        const params = [];

        if (filters.authorId) {
            where += " AND p.author_id = ?";
            params.push(filters.authorId);
        }

        if (filters.categoryId) {
            const categoryIds = String(filters.categoryId)
                .split(",").map(Number).filter(id => !isNaN(id));
            if (categoryIds.length > 0) {
                where += ` AND EXISTS (
                SELECT 1 FROM post_categories pc
                WHERE pc.post_id = p.id AND pc.category_id IN (${categoryIds.map(() => '?').join(',')})
            )`;
                params.push(...categoryIds);
            }
        }

        if (filters.status) {
            where += " AND p.status_post = ?";
            params.push(filters.status);
        }

        if (filters.fromDate) {
            where += " AND p.publish_date >= ?";
            params.push(filters.fromDate);
        }

        if (filters.toDate) {
            where += " AND p.publish_date < DATE_ADD(?, INTERVAL 1 DAY)";
            params.push(filters.toDate);
        }

        const orderBy = sort === "likes"
            ? "COALESCE(plc.likes_count, 0) DESC"
            : "p.publish_date DESC";

        const rows = await db.query(
            `SELECT
                 p.*,
                 u.login AS author_login,
                 u.profile_picture AS author_avatar,

                 COALESCE(plc.likes_count, 0)  AS likes_count,
                 COALESCE(plc.dislikes_count, 0) AS dislikes_count,

                 pl.is_like AS user_is_like,
                 (pf.user_id IS NOT NULL) AS user_fav

             FROM posts p
                      JOIN users u ON u.id = p.author_id

                      LEFT JOIN (
                 SELECT post_id,
                        SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END) AS likes_count,
                        SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END) AS dislikes_count
                 FROM post_likes
                 GROUP BY post_id
             ) plc ON plc.post_id = p.id

              
                      LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?

                
                      LEFT JOIN post_favorites pf ON pf.post_id = p.id AND pf.user_id = ?

                 ${where}
             ORDER BY ${orderBy}
                 LIMIT ? OFFSET ?`,
            [userId, userId, ...params, Number(limit), Number(offset)]
        );

        for (const r of rows) {
            r.categories = await this.getCategories(r.id);

            r.author = {
                id: r.author_id,
                login: r.author_login,
                avatar: r.author_avatar
            };

            r.is_liked = r.user_is_like === 1;
            r.is_disliked = r.user_is_like === 0;
            r.is_favorite = !!r.user_fav;

            delete r.author_login;
            delete r.author_avatar;
            delete r.user_is_like;
            delete r.user_fav;
        }

        return rows;
    }

    static async findByIdForUser(postId, userId = 0, { includeInactive = false } = {}) {
        const rows = await db.query(
            `SELECT
                 p.*,
                 u.id AS author_id,                    
                 u.login AS author_login,
                 u.profile_picture AS author_avatar,
                 pl.is_like AS user_is_like,
                 (pf.user_id IS NOT NULL) AS user_fav,
                 COALESCE(plc.likes_count, 0)  AS likes_count,
                 COALESCE(plc.dislikes_count, 0) AS dislikes_count
             FROM posts p
                      JOIN users u ON u.id = p.author_id

                      LEFT JOIN (
                 SELECT post_id,
                        SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END) AS likes_count,
                        SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END) AS dislikes_count
                 FROM post_likes
                 GROUP BY post_id
             ) plc ON plc.post_id = p.id

                      LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
                      LEFT JOIN post_favorites pf ON pf.post_id = p.id AND pf.user_id = ?

             WHERE p.id = ?
               AND (
                 p.status_post = 'active'
                     OR p.author_id = ?
                     OR ?
                 )
         LIMIT 1`,
            [userId, userId, postId, userId, includeInactive]
        );

        const post = rows[0];
        if (!post) return null;

        post.categories = await this.getCategories(post.id);

        post.author = {
            id: post.author_id,
            login: post.author_login,
            avatar: post.author_avatar
        };

        post.is_liked = post.user_is_like === 1;
        post.is_disliked = post.user_is_like === 0;
        post.likes_count = Number(post.likes_count || 0);
        post.dislikes_count = Number(post.dislikes_count || 0);
        post.is_favorite = !!post.user_fav;

        delete post.author_login;
        delete post.author_avatar;
        delete post.user_is_like;
        delete post.user_fav;

        return post;
    }

    static async findLikedByUser(userId, { page = 1, limit = 10 } = {}) {
        const offset = (Number(page) - 1) * Number(limit);
        const limitNum = Number(limit);

        const sql = `
            SELECT
                p.*,
                u.login AS author_login,
                u.profile_picture AS author_avatar,
                COALESCE(lc.likes_count, 0) AS likes_count,
                COALESCE(lc.dislikes_count, 0) AS dislikes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
                pl2.is_like AS user_is_like,
                (pf.user_id IS NOT NULL) AS user_fav
            FROM post_likes AS pl
                     JOIN posts AS p ON p.id = pl.post_id
                     JOIN users AS u ON u.id = p.author_id
                     LEFT JOIN (
                SELECT post_id,
                       SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END) AS likes_count,
                       SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END) AS dislikes_count
                FROM post_likes
                GROUP BY post_id
            ) AS lc ON lc.post_id = p.id
                     LEFT JOIN post_likes pl2 ON pl2.post_id = p.id AND pl2.user_id = ${Number(userId)}
                     LEFT JOIN post_favorites pf ON pf.post_id = p.id AND pf.user_id = ${Number(userId)}
            WHERE pl.user_id = ${Number(userId)}
              AND pl.is_like = 1
              AND p.status_post = 'active'
            ORDER BY p.publish_date DESC
                LIMIT ${limitNum} OFFSET ${offset};
        `;

        const rows = await db.query(sql);
        if (!rows.length) return [];

        for (const post of rows) {
            post.categories = await this.getCategories(post.id);
            post.author = { id: post.author_id, login: post.author_login, avatar: post.author_avatar };
            delete post.author_login;
            delete post.author_avatar;

            post.is_liked = post.user_is_like === 1;
            post.is_disliked = post.user_is_like === 0;
            post.is_favorite = !!post.user_fav;

            delete post.user_is_like;
            delete post.user_fav;
        }
        return rows;
    }

    static async countLikedByUser(userId) {
        const rows = await db.query(
            `
                SELECT COUNT(DISTINCT p.id) AS total
                FROM post_likes pl
                         JOIN posts p ON p.id = pl.post_id
                WHERE pl.user_id = ? AND pl.is_like = 1
            `,
            [userId]
        );
        return rows[0]?.total || 0;
    }

    static async findFavoritedByUser(userId, { page = 1, limit = 20, sort = "likes" } = {}) {
        const _limit = Number(limit) || 20;
        const _page = Number(page) || 1;
        const offset = (_page - 1) * _limit;

        const orderBy = sort === "date" ? "p.publish_date DESC" : "COALESCE(plc.likes_count, 0) DESC";

        const sql = `
            SELECT
                p.*,
                u.login AS author_login,
                u.profile_picture AS author_avatar,
                COALESCE(plc.likes_count, 0)    AS likes_count,
                COALESCE(plc.dislikes_count, 0) AS dislikes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
                pl.is_like AS user_is_like,
                (pf2.user_id IS NOT NULL) AS user_fav
            FROM post_favorites pf
                     JOIN posts p ON p.id = pf.post_id
                     JOIN users u ON u.id = p.author_id
                     LEFT JOIN (
                SELECT post_id,
                       SUM(CASE WHEN is_like = 1 THEN 1 ELSE 0 END) AS likes_count,
                       SUM(CASE WHEN is_like = 0 THEN 1 ELSE 0 END) AS dislikes_count
                FROM post_likes
                GROUP BY post_id
            ) plc ON plc.post_id = p.id
                     LEFT JOIN post_likes pl   ON pl.post_id = p.id  AND pl.user_id = ?
                     LEFT JOIN post_favorites pf2 ON pf2.post_id = p.id AND pf2.user_id = ?
            WHERE pf.user_id = ?
            ORDER BY ${orderBy}
                LIMIT ? OFFSET ?;
        `;

        const rows = await db.query(sql, [userId, userId, userId, _limit, offset]);

        for (const r of rows) {
            try { r.categories = await this.getCategories(r.id); }
            catch { r.categories = []; }

            r.is_liked = r.user_is_like === 1;
            r.is_disliked = r.user_is_like === 0;
            r.is_favorite = !!r.user_fav;

            r.author = { id: r.author_id, login: r.author_login, avatar: r.author_avatar };

            delete r.author_login;
            delete r.author_avatar;
            delete r.user_is_like;
            delete r.user_fav;
        }
        return rows;
    }

    static async countFavoritedByUser(userId) {
        const sql = `SELECT COUNT(*) AS count FROM post_favorites WHERE user_id = ?`;
        const rows = await db.query(sql, [userId]);
        return rows[0]?.count || 0;
    }

    static async updateByAuthor(postId, authorId, { title, content, categories, status_post }) {

        const rows = await db.query(`SELECT * FROM posts WHERE id = ?`, [postId]);

        if (!rows || rows.length === 0) {
            console.error("No post found with id:", postId);
            throw new Error("Post not found");
        }

        const post = rows[0];
        if (Number(post.author_id) !== Number(authorId)) {
            console.error(`Forbidden: author ${post.author_id} != user ${authorId}`);
            throw new Error("Forbidden");
        }

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (status_post !== undefined) updates.status_post = status_post;

        if (Object.keys(updates).length) {
            const setStr = Object.keys(updates).map(k => `${k} = ?`).join(", ");
            const values = [...Object.values(updates), postId];
            await db.query(`UPDATE posts SET ${setStr} WHERE id = ?`, values);
        }

        if (Array.isArray(categories)) {
            console.log("Updating categories:", categories);
            await db.query("DELETE FROM post_categories WHERE post_id = ?", [postId]);
            const validCats = categories.filter(c => c != null);
            for (const catId of validCats) {
                console.log(`Inserting category link post:${postId} → cat:${catId}`);
                await db.query(
                    "INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)",
                    [postId, catId]
                );
            }
        }

        const updatedRows = await db.query(
            `SELECT
                 p.*,
                 u.id AS author_id,
                 u.login AS author_login,
                 u.profile_picture AS author_avatar,
                 COALESCE(SUM(CASE WHEN pl.is_like = 1 THEN 1 ELSE 0 END), 0) AS likes_count,
                 COALESCE(SUM(CASE WHEN pl.is_like = 0 THEN 1 ELSE 0 END), 0) AS dislikes_count,
                 (EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ? AND is_like = 1)) AS is_liked,
                 (EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ? AND is_like = 0)) AS is_disliked,
                 (EXISTS(SELECT 1 FROM post_favorites WHERE post_id = p.id AND user_id = ?)) AS is_favorite,
                 JSON_ARRAYAGG(JSON_OBJECT('id', c.id, 'title', c.title)) AS categories
             FROM posts p
                      JOIN users u ON u.id = p.author_id
                      LEFT JOIN post_likes pl ON pl.post_id = p.id
                      LEFT JOIN post_categories pc ON pc.post_id = p.id
                      LEFT JOIN categories c ON c.id = pc.category_id
             WHERE p.id = ?
             GROUP BY p.id`,
            [authorId, authorId, authorId, postId]
        );

        const updatedPost = updatedRows[0];
        return updatedPost;
    }

    static async updateByAdmin(postId, { status_post, is_locked, categories }) {
        const updates = {};
        if (status_post !== undefined) updates.status_post = status_post;
        if (is_locked !== undefined) updates.is_locked = is_locked ? 1 : 0;

        if (Object.keys(updates).length) {
            const setStr = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(postId);
            await db.query(`UPDATE posts SET ${setStr} WHERE id = ?`, values);
        }

        if (Array.isArray(categories)) {
            await this.setCategories(postId, categories);
        }
    }

    static async delete(postId) {
        await db.query(`DELETE FROM post_likes WHERE post_id = ?`, [postId]);

        await db.query(`DELETE FROM post_favorites WHERE post_id = ?`, [postId]);

        await db.query(`DELETE FROM reports WHERE post_id = ?`, [postId]);

        await db.query(`DELETE FROM post_categories WHERE post_id = ?`, [postId]);

        await db.query(`
            DELETE cl FROM comment_likes cl
        JOIN comments c ON cl.comment_id = c.id
        WHERE c.post_id = ?
        `, [postId]);

        await db.query(`
            DELETE r FROM reports r
        JOIN comments c ON r.comment_id = c.id
        WHERE c.post_id = ?
        `, [postId]);

        await db.query(`DELETE FROM comments WHERE post_id = ?`, [postId]);

        await db.query(`DELETE FROM posts WHERE id = ?`, [postId]);
    }


    static async getCategories(postId) {
        return await db.query(
            `SELECT c.id, c.title, c.description
             FROM categories c
             JOIN post_categories pc ON pc.category_id = c.id
             WHERE pc.post_id = ?`,
            [postId]
        );
    }

    static async setCategories(postId, categoryIds = []) {
        await db.query(`DELETE FROM post_categories WHERE post_id = ?`, [postId]);
        if (!categoryIds.length) return;

        const values = categoryIds.map(cid => [postId, cid]);
        const placeholders = values.map(() => '(?, ?)').join(', ');
        const flat = values.flat();
        await db.query(`INSERT INTO post_categories (post_id, category_id) VALUES ${placeholders}`, flat);
    }

    static async lock(postId) {
        await db.query(`UPDATE posts SET is_locked = 1 WHERE id = ?`, [postId]);
    }
    static async unlock(postId) {
        await db.query(`UPDATE posts SET is_locked = 0 WHERE id = ?`, [postId]);
    }

    static async addFavorite(postId, userId) {
        await db.query(
            `INSERT IGNORE INTO post_favorites (post_id, user_id) VALUES (?, ?)`,
            [postId, userId]
        );
    }
    static async removeFavorite(postId, userId) {
        await db.query(
            `DELETE FROM post_favorites WHERE post_id = ? AND user_id = ?`,
            [postId, userId]
        );
    }

    static async addReport(userId, postId, reason) {
        return db.query(
            "INSERT IGNORE INTO reports (user_id, post_id, reason) VALUES (?, ?, ?)",
            [userId, postId, reason]
        );
    }

    static async getReportCount(postId) {
        const rows = await db.query(
            "SELECT COUNT(DISTINCT user_id) as count FROM reports WHERE post_id = ?",
            [postId]
        );
        return rows[0]?.count || 0;
    }

    static async deactivate(postId) {
        return db.query(
            "UPDATE posts SET status_post = 'inactive' WHERE id = ?",
            [postId]
        );
    }

    static async search(query) {
        const q = query.trim();

        const results = await db.query(
            `SELECT 
        p.id,
        p.title,
        p.content,
        u.login AS author_login
     FROM posts AS p
     JOIN users AS u ON p.author_id = u.id
     WHERE p.status_post = 'active'
       AND (p.title LIKE ? OR p.content LIKE ?)
     ORDER BY p.publish_date DESC
     LIMIT 10`,
            [`%${q}%`, `%${q}%`]
        );

        if (Array.isArray(results)) {
            return results;
        } else {
            return [results];
        }
    }

    static async getAllReports() {
        const rows = await db.query(`
        SELECT
            r.id,
            r.reason,
            r.created_at,
            u.login AS author,

            p.id AS post_id,
            p.title AS post_title,

            c.id AS comment_id,
            c.content AS comment_content,
            c.post_id AS comment_post_id

        FROM reports AS r
            JOIN users AS u ON u.id = r.user_id
            LEFT JOIN posts AS p ON p.id = r.post_id
            LEFT JOIN comments AS c ON c.id = r.comment_id

        ORDER BY r.created_at DESC
    `);

        const cleanRows = rows.map(r => {
            if (r.comment_id && !r.post_id) {
                return {
                    ...r,
                    post_id: null,
                    post_title: null,
                    post_ref_id: r.comment_post_id
                };
            }
            return r;
        });

        return cleanRows;
    }

    static async decComments(postId) {
        await db.query(
            `UPDATE posts
         SET comments_count = GREATEST(comments_count - 1, 0)
         WHERE id = ?`,
            [postId]
        );
    }


}

export default Post;