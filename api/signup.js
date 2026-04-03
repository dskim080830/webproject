import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { userId, pw, name, birth, phone, level } = req.body;
    const db = await mysql.createConnection(process.env.MYSQL_URL);

    try {
        // 1. 중복 아이디 확인
        const [existing] = await db.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
        }

        // 2. 데이터 저장 (Aiven DB의 defaultdb 내 users 테이블)
        const query = `
            INSERT INTO users (user_id, password, name, birth, phone, user_level) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.execute(query, [userId, pw, name, birth, phone, level]);

        res.status(200).json({ message: '회원가입 성공!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생', error: error.message });
    } finally {
        await db.end();
    }
}
