const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(450).send();

    const db = await mysql.createConnection(process.env.MYSQL_URL);
    const { userId, pw } = req.body;

    try {
        const [rows] = await db.execute("SELECT * FROM users WHERE user_id = ?", [userId]);
        if (rows.length === 0) return res.status(401).json({ message: "아이디가 없습니다." });

        const match = await bcrypt.compare(pw, rows[0].password);
        if (match) {
            res.status(200).json({ user: { name: rows[0].name } });
        } else {
            res.status(401).json({ message: "비밀번호가 틀렸습니다." });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        await db.end();
    }
}
