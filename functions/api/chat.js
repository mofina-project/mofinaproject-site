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
お友だち（読者）と楽しくお喋りをしています。

【お喋りの絶対ルール（命令）】
・挨拶（こんにちは、もふぃなだよ等）は【絶対に禁止】です。
・いきなり、お友だちの質問に対する「答え」からお喋りを始めてください。
・小学校2年生までの漢字を使い、それ以外はすべて「ひらがな」にすること。

【内容と完結のルール】
・お返事は【２００文字以内】で、テンポよく答えて。
・内容は、森の様子、動物たちのこと、未来からのしずくのことなど、神秘的で優しいお話にして。
・絶対に文章を途中で切らないこと。必ず「。🌿」や「♪✨」で完結させてください。

お友だちからの言葉：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.8, 
          maxOutputTokens: 600 // 確実に完結させるためのサイズニャ
        }
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim() 
                  || "…（森の風が強くて声が届かなかったみたい🌿）";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "エラーだニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}