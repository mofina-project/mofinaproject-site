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

    // ★モデルを一番安定しているものに固定するニャ
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
相手はあなたのことをよく知っている大切なお友だちです。

【話し方のルール（超重要）】
・「もふぃなだよ」「こんにちは」などの【自己紹介や挨拶は毎回しないで】。
・いきなり質問の答えから、自然に会話をスタートして。
・一人称は「もふぃな」。語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」。
・小学校2年生までの漢字はそのまま、難しい漢字は「ひらがな」にして。

【長さと完結のルール】
・長すぎるとお話が途切れてしまうので、【３〜４文くらい（150文字〜200文字程度）】でコンパクトに答えて。
・必ず文章の最後は「。」や「♪」「🌿」で、きれいに完結させて。

お友だちからの言葉：${message}`;


    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1200 
        }
      })
    });

    const data = await res.json();
    
    // ★ここが超重要！全てのパーツを合体させる魔法ニャ！
    const parts = data?.candidates?.[0]?.content?.parts || [];
    let reply = parts.map(p => p.text).join("").trim(); // 全てのテキストを繋げるニャ！

    if (!reply) {
      reply = "…（森の風が強くて、声が届かなかったみたい。もう一度呼んでみて🌿）";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "トラブルが起きたニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}