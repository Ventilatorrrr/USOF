import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export default async function authMiddleware(req, res, next) {
    try {
        const header = req.headers["authorization"];
        if (!header) return res.status(401).json({ message: "No token provided" });

        const token = header.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Invalid token format" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
        const user = await User.findById(decoded.id);

        if (!user) return res.status(401).json({ message: "User not found" });

        if (!user.email_confirmed) {
            return res.status(403).json({ message: "Email not confirmed" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("authMiddleware error:", err.message);
        return res.status(401).json({ message: "Unauthorized", error: err.message });
    }
};

