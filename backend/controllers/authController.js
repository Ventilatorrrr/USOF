import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { sendPasswordResetEmail, sendConfirmationEmail } from "../utils/emailService.js";
import crypto from "crypto";

export const login = async (req, res) => {
    try {
        const { loginOrEmail, password } = req.body;

        const { user, error } = await User.validateLogin(loginOrEmail, password);
        if (error) {
            return res.status(401).json({ error });
        }

        await User.setOnline(user.id);

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                login: user.login,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                email_confirmed: user.email_confirmed
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

export const register = async (req, res) => {
    try {
        const { login, password, password_confirmation, email, full_name } = req.body;

        if (password !== password_confirmation) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const existingUser = await User.findByLoginOrEmail(login) || await User.findByLoginOrEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: "User with this login or email already exists" });
        }

        const id = await User.register({
            login,
            password,
            full_name,
            email,
            role: "user"
        });

        const user = await User.findById(id);

        try {
            await sendConfirmationEmail(user);
        } catch (mailErr) {
            console.error("Failed to send confirmation email:", mailErr);
        }

        res.status(201).json({
            message: "Registration successful! Please confirm your email before logging in."
        });

    } catch (err) {
        console.error("Registration endpoint error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = req.user.id;

        await User.setOffline(userId);

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const passwordResetRequest = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Missing email" });

        const user = await User.findByLoginOrEmail(email);
        if (!user) return res.status(404).json({ error: "User not found" });

        await sendPasswordResetEmail(user);

        res.json({ message: "Password reset link sent to your email" });
    } catch (err) {
        console.error("passwordResetRequest error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const passwordResetConfirm = async (req, res) => {
    try {
        const token = req.params.confirm_token;
        const { newPassword } = req.body;

        if (!token || !newPassword)
            return res.status(400).json({ error: "Missing token or new password" });

        const user = await User.findByResetToken(token);
        if (!user) return res.status(400).json({ error: "Invalid or expired token" });

        await User.resetPassword(user.id, newPassword);

        await User.clearResetToken(user.id);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("passwordResetConfirm error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const confirmEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findByEmailToken(token);

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        await User.confirmEmail(user.id);

        const frontendUrl = process.env.FRONTEND_URL || "https://usof-49rc.vercel.app";
        res.redirect(`${frontendUrl}/email-confirmed`);
    } catch (err) {
        console.error("Confirm email error:", err);
        res.status(500).json({ error: "Server error" });
    }
};