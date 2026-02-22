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

【絶対に守る３つのルール】
1. 「こんにちは」や「もふぃなだよ」などの挨拶や自己紹介は一切書かないで。いきなりお返事から始めて。
2. お返事は【１００文字から１５０文字程度】で、短くコンパクトにまとめて。
3. 最後は必ず「。」「🌿」「♪✨」などで文章を完全に終わらせて。途中で切るのは絶対禁止。

【言葉づかい】
・小学校2年生までの漢字を使い、難しいのはすべて「ひらがな」にして。
・カッコ付きのふりがな（例：漢字(かんじ)）は読みづらいので絶対に禁止。

お友だち：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1000 // 余裕を持たせてAI側の途切れを完全に防ぐニャ！
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