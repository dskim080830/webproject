const express = require('express');
const router = express.Router();
const db = require('../db'); // Aiven DB 연결 설정 파일 경로를 확인하세요.

router.post('/', async (req, res) => {
    // 프론트엔드에서 보낸 데이터 추출
    const { userName, newPw } = req.body;

    // 데이터 유효성 검사
    if (!userName || !newPw) {
        return res.status(400).json({ message: "사용자 정보 또는 비밀번호가 누락되었습니다." });
    }

    try {
        // Aiven DB 비밀번호 업데이트 쿼리
        // 테이블명(users)과 컬럼명(pw, name)은 실제 DB 구조에 맞게 수정이 필요할 수 있습니다.
        const sql = "UPDATE users SET pw = ? WHERE name = ?";
        const [result] = await db.execute(sql, [newPw, userName]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
        } else {
            return res.status(404).json({ message: "해당 사용자를 찾을 수 없습니다." });
        }
    } catch (error) {
        console.error("DB 업데이트 오류:", error);
        return res.status(500).json({ message: "서버 DB 연동 중 오류가 발생했습니다." });
    }
});

module.exports = router;
