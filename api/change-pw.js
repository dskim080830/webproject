// api/change-pw.js
const mysql = require('mysql2/promise');

// DB 연결 풀 생성 (서버리스 환경에서 효율적임)
const pool = mysql.createPool(process.env.MYSQL_URL);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { userName, newPw } = req.body;

    // 현재 로그인된 사용자 정보가 전달되지 않았을 경우
    if (!userName || !newPw) {
        return res.status(400).json({ message: '로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.' });
    }

    try {
        // 1. Aiven MySQL에서 해당 사용자의 비밀번호 업데이트
        // [주의] 테이블명이 'users'이고, 사용자 이름 컬럼이 'name', 비번 컬럼이 'pw'인지 확인 필요
        const [result] = await pool.query(
            'UPDATE users SET pw = ? WHERE name = ?',
            [newPw, userName]
        );

        if (result.affectedRows > 0) {
            console.log(`비밀번호 변경 성공: ${userName}`);
            return res.status(200).json({ message: '성공' });
        } else {
            return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('Aiven DB Error:', error);
        // 실제 오류 내용을 로그로 찍어 Vercel Logs에서 확인 가능하게 함
        return res.status(500).json({ message: '데이터베이스 연결 실패. 잠시 후 다시 시도해주세요.' });
    }
}
