import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    // 프론트엔드에서 보낸 이름과 이메일을 받습니다.
    const { name, email } = req.body; 
    let db;

    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 이름과 이메일이 일치하는 유저의 아이디를 찾습니다.
        const [rows] = await db.execute('SELECT user_id FROM users WHERE name = ? AND email = ?', [name, email]);

        if (rows.length > 0) {
            // [핵심] 마스킹(***) 처리 없이 전체 아이디를 그대로 반환합니다.
            return res.status(200).json({ userId: rows[0].user_id });
        }
        res.status(404).json({ message: "일치하는 회원 정보가 없습니다." });
    } catch (e) {
        res.status(500).json({ message: e.message });
    } finally {
        if (db) await db.end();
    }
}
