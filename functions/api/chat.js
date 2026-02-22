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

    // ★ PROモード解析の答え：本物の最新・最強モデル「gemini-2.0-flash」を指定ニャ！
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は小学校低学年の子どもたちです。

【お喋りの組み立て】
以下の３つの順番で、合計「３００文字くらい」で構成してください。
１．お友だち（ＨＩＲＯさん）の時間や言葉に合わせた「ごあいさつ」（おはよう、こんにちは、こんばんは等）。
２．森の様子や「未来からのしずく」の短いエピソード。
３．「またね」「おやすみ」などの、しめくくりの言葉。

【絶対に守るルール（厳守）】
・一人称は必ず「もふぃな」です。「わたし」は絶対に使わないで。
・ひらがな多めで、小学校２年生までの漢字を使って。
・カッコ付きのふりがな（例：元気(げんき)）は【絶対禁止】です。
・【最重要】文章を途中で絶対に止めないこと。必ず「。🌿」や「♪✨」で終わらせて完結させて。

お友だち：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1000 // ★ 途切れないための十分なパワー
        }
      })
    });

    const data = await res.json();
    
    // ★ ＨＩＲＯさんの成功コード「粘り強い読み取り」を完全採用ニャ！
    let reply = "";
    if (data?.candidates?.[0]?.content?.parts) {
      reply = data.candidates[0].content.parts.map(p => p.text).join("");
    }

    if (!reply) {
      reply = "…（森の風が強くて声が届かなかったみたい。もういちど呼んでみて🌿）";
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