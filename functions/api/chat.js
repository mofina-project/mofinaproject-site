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
読者は小学校低学年の子どもたちです。

【大切なお喋りルール】
・すでに仲良しのお友だちなので、「もふぃなだよ」「こんにちは」といった挨拶は【絶対に禁止】です。
・いきなり質問への答えから始めて、自然に会話をつなげて。
・小学校2年生までの漢字を使い、難しいのはすべて「ひらがな」にして。

【途切れ防止の魔法】
・お喋りは「200文字以内」で、テンポよく返して。
・絶対に文章の途中で終わらないこと。必ず「。🌿」や「♪✨」で物語を完結させて。

お友だちからの言葉：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1500 // 余裕を持たせてパンクを防ぐニャ！
        }
      })
    });

    const data = await res.json();
    
    // 全てのパーツを結合して、不自然な空白をお掃除するニャ
    let reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim() || "";

    if (!reply) {
      reply = "…（森の風が強くて声が届かなかったみたい🌿）";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "エラーだニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}