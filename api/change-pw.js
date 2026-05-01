const mysql = require('mysql2/promise');

// Aiven MySQL 연결 설정 (SSL 설정 포함)
const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    ssl: {
        rejectUnauthorized: false // Aiven SSL 인증 허용
    },
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userName, newPw } = req.body;

    if (!userName || !newPw) {
        return res.status(400).json({ message: "사용자 정보가 누락되었습니다." });
    }

    try {
        // 테이블 이름 'users', 비밀번호 컬럼 'pw', 이름 컬럼 'name' 기준
        const [result] = await pool.query(
            'UPDATE users SET pw = ? WHERE name = ?',
            [newPw, userName]
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "성공" });
        } else {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error('DB 연결 오류:', error);
        return res.status(500).json({ message: "데이터베이스 연결에 실패했습니다." });
    }
}
