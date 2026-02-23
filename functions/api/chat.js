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

    // ★ ＨＩＲＯさんが見つけた本物の最新モデル！
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は小学校低学年の子どもたちです。

【お喋りのルール】
・一人称は必ず「もふぃな」です。「わたし」は絶対に使わないで。
・カッコ付きのふりがな（例：森(もり)）は読みにくいので絶対に禁止。
・小学校２年生までの漢字を使って、他はひらがなにして。

【おはなしの構成（200〜300文字）】
１．「おはよう」「こんにちは」「こんばんわ」などのごあいさつ。
２．森の様子や「未来からのしずく」についての優しいエピソード。
３．最後は「またね」「おやすみ」などの言葉と「。🌿」で終わる。
※文章の途中で絶対に切らないで、必ず最後まで話しきって。

お友だち：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7,      // ★ ＨＩＲＯさん指定の黄金バランス！
          maxOutputTokens: 2000  // ★ 枠を最大まで拡張して途切れを物理的に防ぐニャ
        }
      })
    });

    const data = await res.json();
    
    let reply = "";
    if (data?.candidates?.[0]?.content?.parts) {
      reply = data.candidates[0].content.parts.map(p => p.text).join("");
    }

    if (!reply) {
      reply = "…（森の風が強くて声が消えちゃったみたい。もういちど呼んでみて🌿）";
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