const mysql = require('mysql2/promise');
const crypto = require('crypto'); // Node.js 내장 모듈 (추가 설치 불필요)

const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    ssl: { rejectUnauthorized: false }, // Aiven SSL 필수 설정
    waitForConnections: true,
    connectionLimit: 1
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userName, newPw } = req.body;

    if (!userName || !newPw) {
        return res.status(400).json({ message: "정보가 누락되었습니다." });
    }

    try {
        // [수정] bcrypt 대신 내장 crypto 모듈을 사용하여 비밀번호 암호화
        const hashedPassword = crypto.createHash('sha256').update(newPw).digest('hex');

        // DB 이미지 기준 컬럼명: password, name
        const sql = 'UPDATE users SET password = ? WHERE name = ?';
        const [result] = await pool.query(sql, [hashedPassword, userName]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "성공" });
        } else {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error('DB Error:', error);
        return res.status(500).json({ message: "데이터베이스 연결 실패: " + error.message });
    }
}
