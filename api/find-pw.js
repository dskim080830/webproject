import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    // 프론트엔드에서 넘어온 아이디, 이름, 이메일 정보
    const { userId, name, email } = req.body;
    let db;

    try {
        db = await mysql.createConnection({
            uri: process.env.MYSQL_URL,
            ssl: { rejectUnauthorized: false }
        });

        // 1. 입력한 정보와 일치하는 유저가 있는지 DB에서 확인
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE user_id = ? AND name = ? AND email = ?',
            [userId, name, email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "입력하신 정보와 일치하는 회원이 없습니다." });
        }

        // 2. 임시 비밀번호 생성 (8자리 영문+숫자 랜덤 조합)
        const tempPw = Math.random().toString(36).slice(-8);

        // 3. 생성된 임시 비밀번호를 암호화하여 DB 업데이트 (기존 비밀번호 덮어쓰기)
        const hashedPw = await bcrypt.hash(tempPw, 10);
        await db.execute(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPw, userId]
        );

        // 4. 이메일 발송 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"쉬운 글 배움터" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '[쉬운 글 배움터] 임시 비밀번호가 발급되었습니다.',
            html: `
                <div style="font-family: 'Nanum Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4a90e2;">임시 비밀번호 안내</h2>
                    <p style="font-size: 16px; color: #333; line-height: 1.5;">
                        안녕하세요, <strong>${name}</strong>님.<br>
                        요청하신 임시 비밀번호가 발급되었습니다. 아래 비밀번호로 로그인하신 후 반드시 비밀번호를 변경해 주세요.
                    </p>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 10px; margin-top: 20px;">
                        <span style="font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #e74c3c;">
                            ${tempPw}
                        </span>
                    </div>
                </div>
            `
        };

        // 5. 이메일 전송 실행
        await transporter.sendMail(mailOptions);
        
        return res.status(200).json({ message: "이메일로 임시 비밀번호를 발송했습니다." });

    } catch (e) {
        console.error("비밀번호 찾기 에러:", e);
        return res.status(500).json({ message: "서버 통신 중 오류가 발생했습니다." });
    } finally {
        if (db) await db.end();
    }
}
