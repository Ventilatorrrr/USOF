import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// import initDB from "./db/dbInit.js";
import { connectToDB } from './db/db.js';
import apiRoutes from "./routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://usof-49rc.vercel.app",
    "http://localhost:3000"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Run server
app.listen(PORT, async () => {
    await connectToDB(true);
    console.log(`Server running at http://localhost:${PORT}`);
});
