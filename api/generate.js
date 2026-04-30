// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { instruction } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API Key가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "발달장애인을 위한 퀴즈 생성기입니다. 반드시 다른 설명 없이 순수한 JSON 객체만 출력하세요. 형식: {\"question\": \"문제\", \"options\": [\"보기1\", \"보기2\", \"보기3\"], \"answer\": 0, \"explanation\": \"설명\"}" 
          },
          { role: "user", content: instruction }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" } // 중요: GPT가 JSON으로만 응답하도록 강제
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);
      return res.status(response.status).json({ error: data.error?.message || "GPT 호출 실패" });
    }

    // 클라이언트가 파싱하기 쉽게 content만 바로 보냄
    res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "서버 내부 오류 발생" });
  }
}
