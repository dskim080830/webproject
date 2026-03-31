const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(450).send();
    
    const db = await mysql.createConnection(process.env.MYSQL_URL);
    const { userId, pw, name, phone } = req.body;
    const hashed = await bcrypt.hash(pw, 10);

    try {
        await db.execute(
            "INSERT INTO users (user_id, password, name, phone) VALUES (?, ?, ?, ?)",
            [userId, hashed, name, phone]
        );
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        await db.end();
    }
}
