// api/update-profile.js
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    // 1. PUT 요청만 허용
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // index.html의 payload 데이터 받기
    const { userId, pw, name, email, phone, birth, level } = req.body;

    if (!userId) {
        return res.status(400).json({ message: '사용자 ID가 누락되었습니다.' });
    }

    let db;
    try {
        // TiDB 연결 (MYSQL_URL 환경변수 사용)
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 2. 비밀번호를 변경하는지 여부에 따라 쿼리 분기
        if (pw && pw.trim() !== '') {
            // 새 비밀번호가 입력된 경우 -> 암호화 후 업데이트
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(pw, saltRounds);

            const query = `
                UPDATE users 
                SET name = ?, password = ?, email = ?, phone = ?, birth = ?, user_level = ?
                WHERE user_id = ?
            `;
            await db.execute(query, [
                name, 
                hashedPassword, 
                email || null, 
                phone || null, 
                birth || null, 
                parseInt(level) || 1, 
                userId
            ]);
        } else {
            // 비밀번호를 비워둔 경우 -> 비밀번호 제외하고 업데이트
            const query = `
                UPDATE users 
                SET name = ?, email = ?, phone = ?, birth = ?, user_level = ?
                WHERE user_id = ?
            `;
            await db.execute(query, [
                name, 
                email || null, 
                phone || null, 
                birth || null, 
                parseInt(level) || 1, 
                userId
            ]);
        }

        return res.status(200).json({ message: '개인정보가 성공적으로 수정되었습니다.' });

    } catch (error) {
        console.error("🔥 [UPDATE-PROFILE CRASH]:", error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    } finally {
        if (db) await db.end();
    }
}
