// api/easy-text.js (Vercel Serverless Function)
export default async function handler(req, res) {
  const { text, level } = req.body;
  const apiKey = process.env.OPENAI_API_KEY; // Vercel에 설정한 환경변수

  const prompt = `다음 텍스트를 '${level}' 난이도로 아주 쉽게 변환해줘. 
  어려운 단어는 <span class="word" data-original="원래어려운단어">쉬운단어</span> 형태로 감싸서 반환해줘.
  내용: ${text}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 또는 gpt-3.5-turbo
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const result = data.choices[0].message.content;

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "API 호출 실패" });
  }
}
