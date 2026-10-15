import mysql from 'mysql2';
import { promisify } from "util";
import dotenv from "dotenv";
dotenv.config();

let connection;

export function connectToDB(withDatabase = true) {
    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 18141,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
        ssl: {
            rejectUnauthorized: false     // Дозволяє підключитися до Aiven без явно переданого ca.pem файлу
        }
    });

    connection.query = promisify(connection.query).bind(connection);

    connection.connect(err => {
        if (err) {
            console.error('DB connection error:', err);
            process.exit(1);
        }
        console.log(`DB connected ${withDatabase ? "to " + process.env.DB_NAME : "without database"}`);
    });

    return connection;
}

export const getConnection = () => connection;

export async function query(...args) {
    return connection.query(...args);
}

export default {
    connectToDB,
    getConnection,
    query
};