const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // bcrypt 대신 bcryptjs 사용

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
        // 1. bcryptjs를 사용하여 비밀번호 암호화
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPw, salt);

        // 2. DB 업데이트 (이미지 기준 컬럼명 password, name 적용)
        const sql = 'UPDATE users SET password = ? WHERE name = ?';
        const [result] = await pool.query(sql, [hashedPassword, userName]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "성공" });
        } else {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error('DB Error:', error);
        return res.status(500).json({ message: "DB 연결 실패: " + error.message });
    }
}
