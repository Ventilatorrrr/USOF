// models/User.js
import db from "../db/db.js";
import bcrypt from "bcrypt";

class User {

    static async register({ login, password, full_name, email }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            `INSERT INTO users (login, password, full_name, email, email_confirmed) VALUES (?, ?, ?, ?, 0)`,
            [login, hashedPassword, full_name, email]
        );
        return result.insertId;
    }

    static async validateLogin(loginOrEmail, password) {
        const rows = await db.query(
            `SELECT * FROM users WHERE login = ? OR email = ? LIMIT 1`,
            [loginOrEmail, loginOrEmail]
        );
        const user = rows[0];
        if (!user) return { user: null, error: "User not found" };

        if (!user.email_confirmed) return { user: null, error: "Email not confirmed" };

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return { user: null, error: "Incorrect password" };

        return { user, error: null };
    }

    static async confirmEmail(userId) {
        await db.query(`UPDATE users SET email_confirmed = 1 WHERE id = ?`, [userId]);
    }

    static async setOffline(id) {
        await db.query(`UPDATE users SET status_users = 'offline' WHERE id = ?`, [id]);
    }

    static async setOnline(id) {
        await db.query(`UPDATE users SET status_users = 'online' WHERE id = ?`, [id]);
    }

    static async resetPassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, id]);
    }

    static async createByAdmin({ login, password, full_name, email, role }) {
        const result = await db.query(
            `INSERT INTO users (login, password, full_name, email, role, email_confirmed) VALUES (?, ?, ?, ?, ?, 1)`,
            [login, password, full_name, email, role]
        );
        return result.insertId;
    }

    static async getAll() {
        const rows = await db.query(`
        SELECT 
            u.id,
            u.login,
            u.full_name,
            u.email,
            u.role,
            u.rating,
            u.profile_picture,
            u.status_users,
            u.publish_date AS created_at,
            COUNT(p.id) AS posts_count
        FROM users u
        LEFT JOIN posts p ON p.author_id = u.id
        GROUP BY u.id
        ORDER BY u.publish_date DESC;
    `);

        return rows.map(u => ({
            ...u,
            is_online: u.status_users === "online",
        }));
    }

    static async updateByAdmin(id, fields) {
        const setStr = Object.keys(fields).map(k => `${k} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);
        await db.query(`UPDATE users SET ${setStr} WHERE id = ?`, values);
    }

    static async delete(id) {
        await db.query(`DELETE FROM users WHERE id = ?`, [id]);
    }

    static async updateSelf(id, fields) {
        delete fields.role;
        delete fields.rating;
        delete fields.status_users;
        delete fields.email_confirmed;

        if (!Object.keys(fields).length) return;

        const setStr = Object.keys(fields).map(k => `${k} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);
        await db.query(`UPDATE users SET ${setStr} WHERE id = ?`, values);
    }

    static async setAvatar(id, filePath) {
        await db.query(`UPDATE users SET profile_picture = ? WHERE id = ?`, [filePath, id]);
    }

    static async findById(id) {
        const rows = await db.query(
            `SELECT id, login, email, role, profile_picture, email_confirmed 
         FROM users 
         WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByLoginOrEmail(loginOrEmail) {
        const rows = await db.query(
            `SELECT * FROM users WHERE login = ? OR email = ? LIMIT 1`,
            [loginOrEmail, loginOrEmail]
        );
        return rows[0];
    }

    static async recalcRating(userId) {
        try {

            const postRows = await db.query(`
            SELECT 
                COALESCE(SUM(CASE 
                    WHEN pl.is_like = 1 THEN 1 
                    WHEN pl.is_like = 0 THEN -1 
                    ELSE 0 END), 0) AS post_score
            FROM posts p
            LEFT JOIN post_likes pl ON pl.post_id = p.id
            WHERE p.author_id = ?;
        `, [userId]);

            const postScore = Number(
                (Array.isArray(postRows) ? postRows[0]?.post_score : postRows?.post_score) ?? 0
            );

            const commentRows = await db.query(`
            SELECT 
                COALESCE(SUM(CASE 
                    WHEN cl.is_like = 1 THEN 1 
                    WHEN cl.is_like = 0 THEN -1 
                    ELSE 0 END), 0) AS comment_score
            FROM comments c
            LEFT JOIN comment_likes cl ON cl.comment_id = c.id
            WHERE c.author_id = ?;
        `, [userId]);

            const commentScore = Number(
                (Array.isArray(commentRows) ? commentRows[0]?.comment_score : commentRows?.comment_score) ?? 0
            );

            const rating = postScore + commentScore;

            await db.query(`UPDATE users SET rating = ? WHERE id = ?`, [rating, userId]);

            return rating;
        } catch (err) {
            console.error("recalcRating error:", err);
            throw err;
        }
    }

    static async isAdmin(userId) {
        const rows = await db.query(`SELECT role FROM users WHERE id = ? LIMIT 1`, [userId]);
        return rows.length && rows[0].role === 'admin';
    }

    static async saveResetToken(userId, token) {
        const expires = new Date(Date.now() + 3600000);
        await db.query(
            `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
            [token, expires, userId]
        );
    }

    static async findByResetToken(token) {
        const rows = await db.query(
            `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1`,
            [token]
        );
        return rows[0];
    }

    static async clearResetToken(userId) {
        await db.query(
            `UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
            [userId]
        );
    }

    static async saveEmailToken(userId, token) {
        await db.query(
            "UPDATE users SET email_token = ?, email_confirmed = 0 WHERE id = ?",
            [token, userId]
        );
    }

    static async findByEmailToken(token) {
        const rows = await db.query(
            `SELECT * FROM users WHERE email_token = ? LIMIT 1`,
            [token]
        );
        return rows[0];
    }

    static async updatePassword(userId, hashedPassword) {
        await db.query(
            `UPDATE users SET password = ? WHERE id = ?`,
            [hashedPassword, userId]
        );
    }

    static async updateSocialLinks(id, socialLinks) {

        const json = JSON.stringify(socialLinks);
        await db.query(`UPDATE users SET social_links = ? WHERE id = ?`, [json, id]);
    }

    static async getByIdWithSocials(id) {
        const rows = await db.query(`SELECT * FROM users WHERE id = ?`, [id]);
        if (!rows.length) return null;
        const user = rows[0];

        if (user.social_links && typeof user.social_links === "string") {
            try {
                user.social_links = JSON.parse(user.social_links);
            } catch {
                user.social_links = {};
            }
        }
        return user;
    }


}

export default User;
