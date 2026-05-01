const mysql = require('mysql2/promise');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { userName, newPw } = req.body;

    if (!userName || !newPw) {
        return res.status(400).json({ message: '정보가 누락되었습니다.' });
    }

    // Aiven MySQL 연결 (환경변수 MYSQL_URL 활용)
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    try {
        // 테이블 이름이 'users'이고, 사용자 식별 컬럼이 'name'인 경우의 쿼리입니다.
        // DB 구조에 따라 컬럼명은 수정될 수 있습니다.
        const [result] = await connection.execute(
            'UPDATE users SET pw = ? WHERE name = ?',
            [newPw, userName]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: '비밀번호 변경 성공' });
        } else {
            res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('DB Error:', error);
        res.status(500).json({ message: '데이터베이스 연결 오류가 발생했습니다.' });
    } finally {
        await connection.end();
    }
}
