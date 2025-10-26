import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDB, getConnection } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function initDB() {
    try {
        connectToDB(false);
        const db = getConnection();

        const sql = fs.readFileSync(path.join(__dirname, "db.sql"), "utf8");
        await db.query(sql);

        console.log("Database initialized successfully");

        connectToDB(true);

    } catch (err) {
        console.error("Error initializing database:", err);
    }
}
