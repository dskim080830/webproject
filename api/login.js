import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { userId, pw } = req.body;
    const db = await mysql.createConnection(process.env.MYSQL_URL);

    try {
        // 1. DB에서 사용자 정보 불러오기
        const [rows] = await db.execute(
            'SELECT user_id, name, user_level FROM users WHERE user_id = ? AND password = ?', 
            [userId, pw]
        );

        if (rows.length > 0) {
            // 로그인 성공: 사용자 정보를 프론트엔드로 전달
            res.status(200).json({ 
                message: '로그인 성공!', 
                user: {
                    id: rows[0].user_id,
                    name: rows[0].name,
                    level: rows[0].user_level
                } 
            });
        } else {
            res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생' });
    } finally {
        await db.end();
    }
}
