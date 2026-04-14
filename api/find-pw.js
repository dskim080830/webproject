import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// DB 풀 생성 (매번 연결하지 않고 재사용)
const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: "Method Not Allowed" });
    
    const { userId, name, email } = req.body;

    // 입력값 검증
    if (!userId || !name || !email) {
        return res.status(400).json({ message: "모든 정보를 입력해주세요." });
    }

    try {
        // 1. 유저 확인
        const [rows] = await pool.execute(
            'SELECT user_id FROM users WHERE user_id = ? AND name = ? AND email = ?',
            [userId, name, email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "일치하는 회원 정보가 없습니다." });
        }

        // 2. 임시 비밀번호 생성 (보안상 조금 더 복잡하게 가능)
        const tempPw = Math.random().toString(36).slice(-10); // 10자리

        // 3. 암호화 및 업데이트
        const hashedPw = await bcrypt.hash(tempPw, 10);
        await pool.execute(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPw, userId]
        );

        // 4. 메일 발송 (transporter 설정은 가급적 핸들러 밖으로 빼는 것이 성능에 좋음)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // 앱 비밀번호 사용 필수
            }
        });

        await transporter.sendMail({
            from: `"쉬운 글 배움터" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '[쉬운 글 배움터] 임시 비밀번호 발급 안내',
            html: `
                <div style="max-width: 500px; border: 1px solid #ddd; padding: 20px;">
                    <h2 style="color: #4a90e2;">임시 비밀번호 발급</h2>
                    <p>안녕하세요 ${name}님, 요청하신 임시 비밀번호입니다.</p>
                    <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center;">
                        ${tempPw}
                    </div>
                    <p style="color: red;">* 로그인 후 반드시 비밀번호를 변경해주세요.</p>
                </div>
            `
        });
        
        return res.status(200).json({ message: "임시 비밀번호가 메일로 전송되었습니다." });

    } catch (e) {
        console.error("Error:", e);
        return res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
    }
}
