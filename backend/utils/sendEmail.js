// utils/sendEmail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

export default async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: `"USOF Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent successfully to ${to}. Response: ${info.response}`);
    } catch (err) {
        console.error("Nodemailer transport error:", err);
        throw err;
    }
}