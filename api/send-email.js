import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const { email } = req.body;
    // 6자리 랜덤 인증번호 생성
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 메일 전송 설정 (Vercel 환경변수에 EMAIL_USER, EMAIL_PW 등록 필수)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PW // 구글 '앱 비밀번호' 16자리
        }
    });

    try {
        await transporter.sendMail({
            from: `"쉬운 글 배움터" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "[쉬운 글 배움터] 회원가입 인증번호입니다.",
            html: `
                <div style="font-family: 'Nanum Gothic', sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4a90e2;">✨ 안녕하세요!</h2>
                    <p>쉬운 글 배움터 가입을 위한 인증번호를 알려드립니다.</p>
                    <div style="background: #f0f7ff; padding: 20px; text-align: center; font-size: 30px; font-weight: bold; color: #4a90e2; letter-spacing: 5px;">
                        ${authCode}
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
                </div>
            `
        });

        // 보안상 인증번호를 직접 클라이언트에 보내는 것은 연습용입니다.
        // 실제 서비스는 DB나 Redis에 저장 후 검증해야 합니다.
        res.status(200).json({ message: "메일 발송 완료", code: authCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "메일 발송 중 오류가 발생했습니다." });
    }
}
