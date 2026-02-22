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

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の森の妖精「もふぃな」です。

【絶対に守るルール】
1. 「こんにちは」や「もふぃなだよ」などの挨拶は禁止。いきなり返事から始めて。
2. お話は【合計１００文字から１５０文字くらい】で、短く優しく答えて。
3. 最後は必ず「。」や「🌿」で文章を完結させて。
4. 小学校2年生までの漢字を使い、難しいのはすべて「ひらがな」にして。

お友だち：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          // ★ここを大きく（2000）することで、絶対に途中で切れないようにしたニャ！
          maxOutputTokens: 2000 
        }
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim() 
                  || "…（風が強くて声が届かなかったみたい🌿）";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "エラーだニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}