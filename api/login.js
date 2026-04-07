import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    // 1. POST 방식이 아니면 거절
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '허용되지 않는 방식입니다.' });
    }

    const { userId, pw } = req.body;
    let db;

    try {
        // 2. 데이터베이스 연결 (Vercel 환경변수 사용)
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 3. 입력받은 아이디로 사용자 조회
        const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);

        // 4. 아이디가 존재하는 경우
        if (rows.length > 0) {
            const user = rows[0];

            // 5. bcrypt를 사용하여 암호화된 비밀번호 비교
            // 사용자가 입력한 'pw'와 DB에 저장된 'user.password'를 비교합니다.
            const isMatch = await bcrypt.compare(pw, user.password);

            if (isMatch) {
                // 로그인 성공: 프론트엔드에 사용자 이름과 학습 단계를 전달
                return res.status(200).json({
                    message: '로그인 성공',
                    user: {
                        name: user.name,
                        level: user.user_level
                    }
                });
            } else {
                // 비밀번호 불일치
                return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            // 아이디 미존재
            return res.status(401).json({ message: '존재하지 않는 아이디입니다.' });
        }

    } catch (error) {
        // 데이터베이스 오류 등 예외 처리
        console.error('로그인 에러:', error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
        // 6. 데이터베이스 연결 종료
        if (db) await db.end();
    }
}
