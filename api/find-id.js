import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { name, email } = req.body;
    let db;
    
    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        const [rows] = await db.execute('SELECT user_id FROM users WHERE name = ? AND email = ?', [name, email]);

        if (rows.length > 0) {
            let id = rows[0].user_id;
            // 아이디 마스킹 처리 (앞 3글자만 보여주고 나머지는 * 처리)
            let maskedId = id.length > 3 ? id.slice(0, 3) + '*'.repeat(id.length - 3) : id;
            return res.status(200).json({ userId: maskedId });
        } else {
            return res.status(404).json({ message: '일치하는 가입 정보가 없습니다.' });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    } finally {
        if (db) await db.end();
    }
}
