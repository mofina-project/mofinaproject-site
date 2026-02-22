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

    // ★ ＨＩＲＯさんが見つけてくれた成功のモデル名ニャ！
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は小学校低学年の子どもたち。

【お喋りの組み立て】
以下の３つの順番で、合計「３００文字くらい」で構成して。
１．「こんばんわ」や「こんにちは」のごあいさつ。
２．森の様子や「未来からのしずく」の短いエピソード。
３．「おやすみ」や「またね」などの、しめくくりの言葉。

【絶対に守るルール】
・ひらがな多めで、小学校２年生までの漢字を使って。
・カッコ付きのふりがな「漢字(かんじ)」は【絶対禁止】。
・【最重要】文章を途中で絶対に止めないこと。必ず「。🌿」で終わらせて。

質問：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 800 // ★ パワーを安定させる設定ニャ
        }
      })
    });

    const data = await res.json();
    
    // ★ ここが成功の秘訣！バラバラの言葉を一つに繋ぎ合わせるニャ！
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