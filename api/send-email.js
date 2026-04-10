import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // 1. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: '이메일 주소가 필요합니다.' });
    }

    // 2. 6자리 랜덤 인증번호 생성 (예: 123456)
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. 이메일 발송 설정 (에러가 발생했던 부분 해결)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // 네이버를 쓴다면 'naver'로 변경
        auth: {
            // 반드시 .env 또는 Vercel 환경변수에 아래 두 값이 세팅되어 있어야 합니다!
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  // 로그인 비밀번호가 아닌 '앱 비밀번호(16자리)'
        }
    });

    // 4. 수신자에게 보낼 메일 내용 꾸미기
    const mailOptions = {
        from: `"쉬운 글 배움터" <${process.env.EMAIL_USER}>`, // 보내는 사람
        to: email, // 받는 사람
        subject: '[쉬운 글 배움터] 회원가입 이메일 인증번호입니다.', // 이메일 제목
        html: `
            <div style="font-family: 'Nanum Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4a90e2;">쉬운 글 배움터 인증번호</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.5;">
                    안녕하세요! 쉬운 글 배움터에 가입해 주셔서 감사합니다.<br>
                    아래 인증번호 6자리를 진행 중인 화면에 입력해 주세요.
                </p>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 10px; margin-top: 20px;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #4a90e2;">
                        ${authCode}
                    </span>
                </div>
                <p style="font-size: 14px; color: #999; margin-top: 20px;">
                    본인이 요청하지 않으셨다면 이 메일을 무시해 주세요.
                </p>
            </div>
        `
    };

    try {
        // 5. 이메일 전송
        await transporter.sendMail(mailOptions);
        
        // 6. 성공 시 생성된 인증번호를 프론트엔드로 반환 (index.html에서 이 값을 비교합니다)
        return res.status(200).json({ message: '이메일 발송 성공', code: authCode });
    } catch (error) {
        console.error('이메일 발송 실패 상세 에러:', error);
        return res.status(500).json({ 
            message: '이메일 발송에 실패했습니다.', 
            error: error.message 
        });
    }
}
