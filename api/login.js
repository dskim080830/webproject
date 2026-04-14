import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { userId, pw } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key';
    let db;

    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);

        if (rows.length > 0) {
            const user = rows[0];
            const isMatch = await bcrypt.compare(pw, user.password);

            if (isMatch) {
                // 1. 토큰 생성 (사용자 ID와 이름을 포함)
                const token = jwt.sign(
                    { id: user.user_id, name: user.name, level: user.user_level },
                    JWT_SECRET,
                    { expiresIn: '7d' } // 7일 유지
                );

                // 2. 쿠키 설정 (HttpOnly: 자바스크립트 접근 불가, 보안 강화)
                const cookie = serialize('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 7, // 7일
                    path: '/'
                });

                res.setHeader('Set-Cookie', cookie);
                return res.status(200).json({ name: user.name });
            }
        }
        res.status(401).json({ message: "아이디 또는 비밀번호가 틀립니다." });
    } catch (e) {
        res.status(500).json({ message: e.message });
    } finally {
        if (db) await db.end();
    }
}
