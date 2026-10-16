// utils/sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendEmail(to, subject, html) {
    try {
        const data = await resend.emails.send({
            from: 'USOF Support <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html,
        });

        console.log(`Email sent via Resend API to ${to}:`, data);
        return data;
    } catch (err) {
        console.error("Resend API error:", err);
        // Не кидаємо throw, щоб сервер не упав у 502, якщо домен пошти некоректний
    }
}