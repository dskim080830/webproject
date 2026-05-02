const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // 비밀번호 암호화를 위해 필요

const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userName, newPw } = req.body;

    if (!userName || !newPw) {
        return res.status(400).json({ message: "정보가 누락되었습니다." });
    }

    try {
        // 1. 새 비밀번호를 Bcrypt로 암호화 (이미지의 데이터 형식과 일치시킴)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPw, saltRounds);

        // 2. DB 업데이트 (이미지의 컬럼명 'password'와 'name' 반영)
        const sql = 'UPDATE users SET password = ? WHERE name = ?';
        const [result] = await pool.query(sql, [hashedPassword, userName]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "성공" });
        } else {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error('DB Error:', error);
        return res.status(500).json({ message: "데이터베이스 연결 실패" });
    }
}
