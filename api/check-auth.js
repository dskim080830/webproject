import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key';

    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.status(200).json({ name: decoded.name, level: decoded.level });
    } catch (e) {
        res.status(401).json({ message: 'Invalid token' });
    }
}
