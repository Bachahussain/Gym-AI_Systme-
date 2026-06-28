// Trigger nodemon restart
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import { otpStore } from './otpStore.js';
import dotenv from 'dotenv';
dotenv.config();

export const sendOtp = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please fill all fields' });
    }

    try {
        // Check if user already exists
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Generate a 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store in memory (expires in 10 mins)
        otpStore.set(email, {
            name,
            email,
            hashedPassword,
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
        });

        // Set up nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'GymAI - Verify your email address',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #6d28d9; text-align: center;">GymAI</h2>
                <p>Hi ${name},</p>
                <p>Thank you for signing up for GymAI. To complete your registration, please use the following One-Time Password (OTP):</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best,<br>The GymAI Team</p>
            </div>
            `,
        };

        let emailSent = false;
        try {
            await transporter.sendMail(mailOptions);
            emailSent = true;
        } catch (emailErr) {
            console.error('Warning: Failed to send OTP email:', emailErr.message);
            // Email failed but we still allow signup — OTP is stored in memory
        }

        return res.json({ 
            success: true, 
            message: emailSent ? 'OTP sent to your email' : 'OTP generated (email delivery failed, check server logs)',
            // In production remove the line below. Only for fallback debugging.
            fallbackOtp: emailSent ? undefined : otp
        });
    } catch (err) {
        console.error('Error in send-otp:', err);
        return res.status(500).json({ error: 'Failed to process signup. Please try again.', details: err.message });
    }
};
