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
親友のＨＩＲＯさんとお喋りしています。

【お喋りの絶対ルール】
・「こんにちは」などの【自己紹介や挨拶は禁止】です。いきなり返事から始めてニャ。
・小学校2年生までの漢字を使い、難しいのはすべて「ひらがな」にして。
・カッコ付きのふりがな（例：漢字(かんじ)）は読みづらいので【絶対禁止】。

【完結のルール】
・返事は【短く３文以内（１００文字くらい）】で答えて。
・必ず最後は「。またね🌿」「。おやすみ♪」「。いってきます✨」のように【短い締めの言葉】でピシッと終わらせて。
・文章の途中で止めるのは絶対にダメだよ！

ＨＩＲＯさん：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1000 // パワーを最大級に確保して途切れを防ぐニャ！
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
    return new Response(JSON.stringify({ reply: "エラーだニャ。もう一度呼んでみて🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}