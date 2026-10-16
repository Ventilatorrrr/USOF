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

        if (data.error) {
            console.warn(`[Resend Test Mode] Could not send to ${to}: ${data.error.message}`);
            console.log(`[Confirmation Email Preview]:\n${html}`);
        } else {
            console.log(`Email successfully sent to ${to}`);
        }

        return data;
    } catch (err) {
        console.error("Resend API error:", err);
    }
}