const express = require('express');
const router = express.Router();
// 기존 DB 연결 모듈이 있다면 가져옵니다 (예: db.js)
const db = require('./db'); 

router.post('/', async (req, res) => {
    // 프론트엔드에서 보낸 정보
    const { userName, newPw } = req.body;

    // 현재 세션에 유저 정보가 있는지 혹은 userName이 유효한지 확인
    if (!userName || !newPw) {
        return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
    }

    try {
        // Aiven DB 업데이트 쿼리 실행
        // 테이블명(users)과 컬럼명(pw, name)은 실제 DB 환경에 맞춰 수정하세요.
        const query = "UPDATE users SET pw = ? WHERE name = ?";
        const [result] = await db.execute(query, [newPw, userName]);

        if (result.affectedRows > 0) {
            console.log(`[성공] ${userName}님의 비밀번호가 변경되었습니다.`);
            return res.status(200).json({ message: "비밀번호 변경 성공" });
        } else {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error("Aiven DB 업데이트 중 오류:", error);
        return res.status(500).json({ message: "서버 DB 연동 오류" });
    }
});

module.exports = router;
