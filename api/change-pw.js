const mysql = require('mysql2/promise');

// SSL 설정을 포함한 연결 풀 생성 (Aiven 필수 설정)
const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    ssl: { rejectUnauthorized: false }, // Aiven SSL 연결 허용
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userName, newPw } = req.body;

    if (!userName || !newPw) {
        return res.status(400).json({ message: "유효하지 않은 요청입니다." });
    }

    try {
        // [필독] 테이블명과 컬럼명이 실제 DB와 일치하는지 확인하세요.
        // 현재 기준: 테이블 'users', 비밀번호 컬럼 'pw', 이름 컬럼 'name'
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
        console.error('DB Error:', error);
        return res.status(500).json({ message: "데이터베이스 연결 오류가 발생했습니다." });
    }
}
