// services/emailService.js
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { confirmationEmailTemplate, passwordResetTemplate } from "../utils/emailTemplates.js";
import User from "../models/UserModel.js";

export async function sendConfirmationEmail(user) {
    const token = crypto.randomBytes(32).toString("hex");
    await User.saveEmailToken(user.id, token);

    const baseUrl = process.env.FRONTEND_URL || "https://usof-49rc.vercel.app";
    const confirmUrl = `${baseUrl}/confirm-email/${token}`;

    const html = confirmationEmailTemplate(user.login, confirmUrl);
    await sendEmail(user.email, "Підтвердіть вашу електронну адресу", html);
}

export async function sendPasswordResetEmail(user) {
    const token = crypto.randomBytes(32).toString("hex");
    await User.saveResetToken(user.id, token);

    const frontendUrl = process.env.FRONTEND_URL || "https://usof-49rc.vercel.app";
    const resetUrl = `${frontendUrl}/password-reset/confirm/${token}`;

    const html = passwordResetTemplate(user.login, resetUrl);
    await sendEmail(user.email, "Відновлення пароля", html);
}