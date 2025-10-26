// controllers/userController.js
import User from "../models/UserModel.js";
import bcrypt from "bcrypt";

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (err) {
        console.error("getAllUsers:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.getByIdWithSocials(req.params.user_id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error("getUserById:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createUser = async (req, res) => {
    try {
        const { login, password, password_confirmation, full_name, email, role } = req.body;

        if (password !== password_confirmation) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = await User.createByAdmin({
            login,
            password: hashedPassword,
            full_name,
            email,
            role
        });

        res.status(201).json({ message: 'User created', id });
    } catch (err) {
        console.error("createUser:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const currentUser = req.user;
        const targetId = req.params.user_id || currentUser.id;
        const filePath = `/uploads/avatars/${req.file.filename}`;

        if (currentUser.role !== "admin" && currentUser.id !== Number(targetId)) {
            return res.status(403).json({ error: "Access denied" });
        }

        await User.setAvatar(targetId, filePath);

        res.json({
            message: "Avatar uploaded successfully",
            avatar: filePath,
            updated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error("updateAvatar:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const updateAvatarForUser = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const targetUserId = parseInt(req.params.user_id);
        const currentUser = req.user;

        if (currentUser.id !== targetUserId && currentUser.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const filePath = `/uploads/avatars/${req.file.filename}`;
        await User.setAvatar(targetUserId, filePath);

        res.json({
            message: "Avatar updated successfully",
            avatar: filePath,
            updated_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error("updateAvatarForUser:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { login } = req.body;
        const targetId = req.params.user_id;
        const currentUser = req.user;

        if (currentUser.id !== Number(targetId) && currentUser.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        if (login && login.trim().length < 3) {
            return res.status(400).json({ error: "Login must be at least 3 characters long" });
        }

        if (login) {
            const existing = await User.findByLoginOrEmail(login);
            if (existing && existing.id !== Number(targetId)) {
                return res.status(400).json({ error: "This login is already taken" });
            }
        }

        await User.updateSelf(targetId, { login });
        const updatedUser = await User.findById(targetId);

        res.json({ message: "User updated successfully", updatedUser });
    } catch (err) {
        console.error("updateUser:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.user_id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.delete(userId);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error("deleteUser:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateSocialLinks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { social_links } = req.body;

        if (!social_links || typeof social_links !== "object") {
            return res.status(400).json({ error: "Invalid social_links object" });
        }

        await User.updateSocialLinks(userId, social_links);
        res.json({ message: "Social links updated", social_links });
    } catch (err) {
        console.error("updateSocialLinks:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const updateLogin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { login } = req.body;

        if (!login || login.trim().length < 3) {
            return res.status(400).json({ error: "Login must be at least 3 characters long" });
        }

        const existing = await User.findByLoginOrEmail(login);
        if (existing && existing.id !== userId) {
            return res.status(400).json({ error: "This login is already taken" });
        }

        await User.updateSelf(userId, { login });
        const updatedUser = await User.findById(userId);

        res.json({ message: "Login updated successfully", updatedUser });
    } catch (err) {
        console.error("updateLogin error:", err);
        res.status(500).json({ error: "Server error" });
    }
};