import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    // 1. GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. 로그인 확인 (세션 기반인 경우 쿠키를 확인하거나, 
    // 여기서는 간단히 쿼리 파라미터로 userId를 받는다고 가정하거나 
    // 실제 로그인 세션 로직에 따라 구현합니다.)
    // 만약 로그인 세션 라이브러리를 안 쓰신다면, 
    // 프론트에서 fetch(`/api/get-profile?userId=${userId}`) 처럼 보낼 수 있습니다.
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: '로그인이 필요합니다.' });
    }

    let db;
    try {
        // TiDB 연결 (환경변수 MYSQL_URL 사용)
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 3. 해당 사용자의 정보 조회 (비밀번호는 보안상 제외)
        const [rows] = await db.execute(
            'SELECT user_id, name, email, phone, birth FROM users WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 4. 조회된 정보 반환
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ message: '서버 오류 발생', error: error.message });
    } finally {
        if (db) await db.end();
    }
}
