const mysql = require('mysql2/promise');

// Aiven MySQL 연결 설정 (이미지 정보 반영)
const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    // Aiven의 ssl-mode=REQUIRED 대응을 위해 필수 설정
    ssl: {
        rejectUnauthorized: false 
    },
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // 프론트엔드에서 보낸 정보 (index (2).html의 fetch와 연동)
    const { userName, newPw } = req.body;

    if (!userName || !newPw) {
        return res.status(400).json({ message: "사용자 정보가 누락되었습니다." });
    }

    try {
        /**
         * [중요] 이미지 10a419.png의 실제 컬럼명 반영
         * - 비밀번호 컬럼: password
         * - 사용자 이름 컬럼: name
         */
        const sql = 'UPDATE users SET password = ? WHERE name = ?';
        const [result] = await pool.query(sql, [newPw, userName]);

        if (result.affectedRows > 0) {
            console.log(`비밀번호 변경 성공: ${userName}`);
            return res.status(200).json({ message: "성공" });
        } else {
            return res.status(404).json({ message: "해당 이름의 사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error('Aiven DB Error:', error);
        return res.status(500).json({ 
            message: "데이터베이스 연결 실패. SSL 또는 테이블 구조를 확인하세요.",
            details: error.message 
        });
    }
}
