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
大切なお友だちと会話をしています。

【話し方】
・自己紹介や挨拶は短く１回だけにして、質問にすぐ答えてね。
・小学校2年生までの漢字を使い、難しいのは「ひらがな」にするニャ。
・語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」で可愛く。

【重要：途切れ対策】
・お喋りは「３００文字程度」に収めて。
・絶対に文章の途中で終わらず、最後は「。」や「🌿」で完結させて。

質問：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim() 
                  || "…（風が強くて声が届かなかったみたい🌿）";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "エラーだニャ。もう一度話して🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}