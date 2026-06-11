import pool from '../../db.js';
import jwt from 'jsonwebtoken';
import { otpStore } from './otpStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
        return res.status(400).json({ error: 'No pending registration found for this email or OTP expired' });
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP has expired. Please sign up again.' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid, insert user
    let newUserId;
    try {
        const [insertResult] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [storedData.name, storedData.email, storedData.hashedPassword]
        );
        newUserId = insertResult.insertId;
    } catch (err) {
        console.error('Error creating user after OTP verification:', err);
        return res.status(500).json({ error: 'Database error while creating user' });
    }

    // Clear OTP from store
    otpStore.delete(email);

    // Issue JWT
    const payload = { id: newUserId, email: storedData.email, name: storedData.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, name: storedData.name, token });
};
