import jwt from 'jsonwebtoken';
import pool from '../db.js';
const JWT_SECRET = 'your_jwt_secret_key'; // In a real app, this should come from environment variables

async function authMiddleware(req, res, next) {
    const token = req.cookies.token;  // read the cookie
    if (!token) {
        return res.status(401).json({ loggedIn: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Backward compatibility for tokens generated before 'id' was added
        if (!decoded.id && decoded.email) {
            const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [decoded.email]);
            if (rows.length > 0) {
                decoded.id = rows[0].id;
            }
        }

        req.user = decoded; // Attach the decoded payload (like {id, email, name}) to the request object
        next();
    } catch (err) {
        return res.status(401).json({ loggedIn: false, message: 'Invalid token' });
    }
}
export default authMiddleware;