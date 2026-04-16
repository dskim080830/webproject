// api/generate.js
export default async function handler(req, res) {
  // 환경 변수에서 키를 가져옵니다. (Vercel 설정에서 등록할 예정)
  const apiKey = process.env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(req.body), // 클라이언트에서 보낸 본문을 그대로 전달
  });

  const data = await response.json();
  res.status(200).json(data);
}
