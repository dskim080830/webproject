import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt'; // 1. bcrypt 임포트 추가

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { userId, pw, email, name, birth, phone, level } = req.body;
    
    let db;
    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 아이디 중복 확인
        const [existing] = await db.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
        }

        // 2. 비밀번호 암호화 로직 추가 (중요!)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(pw, saltRounds);

        // 3. DB 저장 시 'pw' 대신 'hashedPassword'를 넣습니다.
        const query = `
            INSERT INTO users (user_id, password, email, name, birth, phone, user_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.execute(query, [userId, hashedPassword, email, name, birth, phone, level]);

        res.status(200).json({ message: '회원가입 성공!' });
    } catch (error) {
        console.error("DB 에러 상세:", error);
        res.status(500).json({ message: '서버 오류 발생', error: error.message });
    } finally {
        if (db) await db.end();
    }
}
