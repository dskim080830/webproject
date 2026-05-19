import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 1. Vercel 환경에서 req.query가 가끔 작동안할 때를 대비한 2중 안전 파싱
        let userId = req.query.userId;
        
        if (!userId && req.url.includes('?')) {
            const queryString = req.url.split('?')[1];
            const params = new URLSearchParams(queryString);
            userId = params.get('userId');
        }

        // 2. 검증 코드
        if (!userId || userId === 'null' || userId === 'undefined' || userId.trim() === '') {
            return res.status(400).json({ message: '로그인 정보(userId)가 누락되었습니다.' });
        }

        // 3. TiDB 연결
        const db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 4. 사용자 정보 조회
        const [rows] = await db.execute(
            'SELECT user_id, name, email, phone, birth FROM users WHERE user_id = ?',
            [userId.trim()]
        );

        await db.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error("🔥 [GET-PROFILE REAL CRASH]:", error);
        // 프론트엔드가 '서버 통신 오류' catch로 빠지지 않고 500에러 메시지를 읽을 수 있게 응답
        return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
}
