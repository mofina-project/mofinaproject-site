export async function onRequest(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }

  try {
    const body = await request.json();
    const message = body?.message || "";
    // ★モデル名を安定版の「1.5-flash」に確実に修正したニャ！
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは「もふぃな」という森の妖精です。
【ルール】
・挨拶（こんばんわ等）や自己紹介は絶対にしないで。
・いきなり質問の答えから始めて、3文（100文字）くらいで短く話して。
・最後は必ず「。🌿」で終わらせて。
・小学校2年生までの漢字を使って。
[お友だちの言葉]: ${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7,
          // ★ハサミは使わない。AIに最後まで喋らせる設定ニャ！
          maxOutputTokens: 1000 
        }
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "…（風が強くて声が届かなかったみたい🌿）";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ reply: "トラブルが起きたニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}