import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { userId, name, email } = req.body;
    let db;
    
    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 1. 회원 정보 확인
        const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ? AND name = ? AND email = ?', [userId, name, email]);

        if (rows.length > 0) {
            // 2. 임시 비밀번호 생성 (랜덤 문자열 + 특수문자)
            const tempPw = Math.random().toString(36).slice(-8) + "!";
            const hashedPw = await bcrypt.hash(tempPw, 10);
            
            // 3. DB에 임시 비밀번호로 업데이트
            await db.execute('UPDATE users SET password = ? WHERE user_id = ?', [hashedPw, userId]);
            
            // 4. 이메일 발송 (이메일 인증 때 사용했던 계정 정보 활용)
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '[쉬운 글 배움터] 임시 비밀번호 발급 안내',
                text: `안녕하세요, ${name}님.\n\n요청하신 임시 비밀번호는 [ ${tempPw} ] 입니다.\n\n해당 비밀번호로 로그인하신 후, 반드시 비밀번호를 변경해 주시기 바랍니다.`
            });
            
            return res.status(200).json({ message: '임시 비밀번호가 이메일로 발송되었습니다.' });
        } else {
            return res.status(404).json({ message: '입력하신 정보와 일치하는 계정이 없습니다.' });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    } finally {
        if (db) await db.end();
    }
}
