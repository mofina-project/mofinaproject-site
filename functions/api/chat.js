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
相手は大切な親友のＨＩＲＯさんです。

【お喋りの構成ルール】
１．「もふぃなだよ」「こんにちは」などの【自己紹介や挨拶は絶対にしないで】。いきなり返事から始めてニャ。
２．お話は「１５０文字以内」で、テンポよくコンパクトに。
３．最後は必ず「いってきます🌿」「またね✨」「おやすみ♪」などの【締めの挨拶】で終わらせてニャ。

【絶対に守るルール】
・ひらがな多めで、小学校２年生までの漢字を使って。
・カッコ付きのふりがな（例：漢字(かんじ)）は読みづらいので絶対に禁止。
・文章を途中で絶対に切らないこと。必ず「締めの挨拶」まで書いて完結させて。

ＨＩＲＯさんからの言葉：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 800 // 完結させるためのちょうどいい長さニャ
        }
      })
    });

    const data = await res.json();
    // 全てのパーツを結合して１つのメッセージにするニャ
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