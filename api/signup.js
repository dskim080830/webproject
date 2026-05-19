import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // index.html의 payload와 정확히 매칭 (userId, pw, email, name, phone, birth, level)
    const { userId, pw, email, name, phone, birth, level } = req.body;
    
    // 필수 데이터 검증
    if (!userId || !pw || !email || !name) {
        return res.status(400).json({ message: '필수 입력 항목이 누락되었습니다.' });
    }
    
    let db;
    try {
        // TiDB 연결 (질문자님의 환경변수 MYSQL_URL 사용)
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 1. 아이디 중복 확인
        const [existing] = await db.execute('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
        }

        // 2. 비밀번호 암호화
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(pw, saltRounds);

        // 3. DB 저장 쿼리 (TiDB 테이블 구조에 맞춰 안전하게 매핑)
        // 아까 에러가 났던 birth와 user_level(level)을 순서대로 바인딩합니다.
        const query = `
            INSERT INTO users (user_id, password, email, name, birth, phone, user_level) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // level이 안 넘어올 경우를 대비해 기본값 1 부여
        await db.execute(query, [
            userId, 
            hashedPassword, 
            email, 
            name, 
            birth || null, 
            phone || null, 
            parseInt(level) || 1
        ]);

        return res.status(200).json({ message: '회원가입 성공!' });

    } catch (error) {
        // Vercel Log에서 상세 에러를 정확히 볼 수 있도록 콘솔 출력
        console.error("🔥 [API SIGNUP ERROR]:", error);
        
        // 데이터베이스 테이블이나 컬럼이 없을 때 예외 처리 안내
        return res.status(500).json({ 
            message: '서버 내부 오류가 발생했습니다.', 
            error: error.message,
            sqlState: error.sqlState
        });
    } finally {
        if (db) await db.end();
    }
}
