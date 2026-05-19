import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    // 1. GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Node.js url.parse() 경고를 우회하기 위한 안전한 WHATWG URL 파싱
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const myUrl = new URL(req.url, `${protocol}://${host}`);
        
        // 주소창에서 ?userId=xxx 부분을 가져옵니다.
        const userId = myUrl.searchParams.get('userId');

        // 로그인 검증 실패 시 로그 출력 및 400 에러 반환
        if (!userId || userId === 'null' || userId === 'undefined' || userId.trim() === '') {
            console.warn("⚠️ [GET-PROFILE WARN]: userId 파라미터가 비어있습니다.");
            return res.status(400).json({ message: '로그인 정보(userId)가 누락되었습니다.' });
        }

        // TiDB 연결 (MYSQL_URL 환경변수 사용)
        const db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 사용자 정보 조회 (비밀번호는 안전하게 제외)
        const [rows] = await db.execute(
            'SELECT user_id, name, email, phone, birth FROM users WHERE user_id = ?',
            [userId]
        );

        await db.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
        }

        // 조회 성공 시 데이터 반환
        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error("🔥 [GET-PROFILE CRASH]:", error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
}
