import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { userId, pw } = req.body;
    let db;

    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 1. 아이디로 사용자 찾기
        const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);

        if (rows.length > 0) {
            const user = rows[0];

            // 2. 암호화된 비밀번호 비교 (핵심 부분!)
            // bcrypt.compare(사용자가 입력한 생 암호, DB에 저장된 암호화된 암호)
            const isMatch = await bcrypt.compare(pw, user.password);

            if (isMatch) {
                // 로그인 성공
                return res.status(200).json({
                    message: '로그인 성공',
                    user: { name: user.name }
                });
            } else {
                // 비밀번호가 틀린 경우
                return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            // 아이디가 없는 경우
            return res.status(401).json({ message: '존재하지 않는 아이디입니다.' });
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    } finally {
        if (db) await db.end();
    }
}
