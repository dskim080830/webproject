import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    // 1. 프론트엔드에서 보낸 데이터 받기 (email 추가됨)
    const { userId, pw, email, name, birth, phone, level } = req.body;
    
    let db;
    try {
        // 2. DB 연결 설정 (객체 방식으로 깔끔하게 정리)
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 3. 아이디 중복 확인
        const [existing] = await db.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
        }

        // 4. 데이터 저장 로직 (email 컬럼 추가)
        const query = `
            INSERT INTO users (user_id, password, email, name, birth, phone, user_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.execute(query, [userId, pw, email, name, birth, phone, level]);

        res.status(200).json({ message: '회원가입 성공!' });
    } catch (error) {
        console.error("DB 에러 상세:", error);
        res.status(500).json({ message: '서버 오류 발생', error: error.message });
    } finally {
        // 5. 연결 종료
        if (db) await db.end();
    }
}
