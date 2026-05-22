// api/update-profile.js
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    // 1. PUT 요청만 허용
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // index.html에서 보낸 변수명 그대로 매핑
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

        // '일반인(4)' 같은 문자열 데이터를 안전하게 숫자 4로 변환 (기본값 1)
        const numericLevel = parseInt(level, 10) || 1;

        // 2. 비밀번호를 새로 입력했는지 여부에 따라 쿼리 작동
        if (pw && pw.trim() !== '') {
            // 비밀번호도 같이 변경할 때
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(pw, saltRounds);

            // ⭐ TiDB의 실제 컬럼명인 user_level에 numericLevel을 정확히 대입합니다.
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
                numericLevel, 
                userId
            ]);
        } else {
            // 비밀번호는 바꾸지 않고 다른 정보만 변경할 때
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
                numericLevel, 
                userId
            ]);
        }

        return res.status(200).json({ message: '개인정보가 성공적으로 수정되었습니다.' });

    } catch (error) {
        console.error("🔥 [UPDATE-PROFILE LEVEL CRASH]:", error);
        return res.status(500).json({ message: '서버 내부 오류로 수정을 반영하지 못했습니다.', error: error.message });
    } finally {
        if (db) await db.end();
    }
}
