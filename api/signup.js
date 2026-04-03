import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { userId, pw, name, birth, phone, level } = req.body;
    
    // DB 연결 설정
    const dbConfig = {
        uri: process.env.MYSQL_URL,
        ssl: { rejectUnauthorized: false } // 클라우드 DB 필수 설정
    };

    let db;
    try {
        db = await mysql.createConnection(dbConfig.uri + "?sslmode=REQUIRED"); 
        // 또는 주소 뒤에 직접 붙이지 않고 객체로 전달
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 중복 확인 및 삽입 로직...
        const [existing] = await db.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
        }

        const query = `INSERT INTO users (user_id, password, name, birth, phone, user_level) VALUES (?, ?, ?, ?, ?, ?)`;
        await db.execute(query, [userId, pw, name, birth, phone, level]);

        res.status(200).json({ message: '회원가입 성공!' });
    } catch (error) {
        console.error("DB 에러 상세:", error);
        res.status(500).json({ message: 'DB 연결 실패!', error: error.message });
    } finally {
        if (db) await db.end();
    }
}
