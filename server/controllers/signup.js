import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
async function signup(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please fill all fields' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let newUserId;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const [insertResult] = await pool.query('insert into users (name, email, password) values (?, ?, ?)', [name, email, hashedPassword]);
        newUserId = insertResult.insertId;
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
    }
    const payload = { id: newUserId, email: email, name: name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    res.cookie('token', token, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    })
    res.json({ success: true, name: name });
}
export default signup;