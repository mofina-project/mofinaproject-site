export async function onRequest(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();
  
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const body = await request.json();
    const message = body?.message || "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は小学校低学年の子どもたち。

【ルール】
・一人称は「もふぃな」です。
・語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」など可愛く。
・小学校1〜2年生の漢字以外は、すべて「ひらがな」にして。
・「」を使いすぎないで。使うなら必ず閉じ「」まで書いて。
・思考プロセス（thinking）は出力せず、お返事の言葉だけを書いて。
・７００文字以内で、必ず【お話を完結】させて。

質問：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.8, 
          maxOutputTokens: 1500 // ★パワーを安定させるニャ
        }
      })
    });

    const data = await res.json();
    
    // ★ここを「粘り強い読み取り」に改造したニャ！
    let reply = "";
    if (data?.candidates?.[0]?.content?.parts) {
      reply = data.candidates[0].content.parts.map(p => p.text).join("");
    }

    if (!reply) {
      reply = "…（森の奥で、もふぃなの声が消えちゃったみたい。もういちど呼んでみて🌿）";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: `トラブルだニャ: ${error.message}` }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}