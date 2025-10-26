// models/Category.js
import db from "../db/db.js";

class Category {

    static async create({ title, description = null }) {
        const result = await db.query(
            `INSERT INTO categories (title, description)
             VALUES (?, ?)`,
            [title, description]
        );
        return result.insertId;
    }

    static async getAll() {
        const rows = await db.query(
            `SELECT id, title, description
             FROM categories
             ORDER BY id ASC`
        );
        return rows;
    }

    static async getById(id) {
        const rows = await db.query(
            `SELECT id, title, description
             FROM categories
             WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async update(id, fields) {
        if (!Object.keys(fields).length) return;

        const setStr = Object.keys(fields).map(k => `${k} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);

        await db.query(
            `UPDATE categories 
             SET ${setStr} 
             WHERE id = ?`,
            values
        );
    }

    static async getPosts(categoryId) {
        return await db.query(
            `SELECT p.id, p.title, p.content, p.publish_date, p.author_id
         FROM posts p
         JOIN post_categories pc ON p.id = pc.post_id
         WHERE pc.category_id = ?`,
            [categoryId]
        );
    }

    static async delete(id) {
        await db.query(
            `DELETE FROM categories WHERE id = ?`,
            [id]
        );
    }
}

export default Category;