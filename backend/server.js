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
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
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
