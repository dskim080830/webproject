// api/get-profile.js
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Vercel 환경에서 req.query 안전 파싱
        let userId = req.query.userId;
        
        if (!userId && req.url.includes('?')) {
            const queryString = req.url.split('?')[1];
            const params = new URLSearchParams(queryString);
            userId = params.get('userId');
        }

        if (!userId || userId === 'null' || userId === 'undefined' || userId.trim() === '') {
            return res.status(400).json({ message: '로그인 정보(userId)가 누락되었습니다.' });
        }

        // TiDB 연결
        const db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // ⭐ [중요 수정] 조회 항목에 'user_level' 컬럼을 명확하게 추가했습니다!
        const [rows] = await db.execute(
            'SELECT user_id, name, email, phone, birth, user_level FROM users WHERE user_id = ?',
            [userId.trim()]
        );

        await db.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
        }

        // 조회 성공 시 user_level을 포함한 전체 데이터를 프론트엔드로 반환
        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error("🔥 [GET-PROFILE REAL CRASH]:", error);
        return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
}
