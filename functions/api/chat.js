export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === "GET") {
    return new Response("api/chat ok. use POST.", { status: 200 });
  }

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (method !== "POST") {
    return new Response(`Method Not Allowed: ${method}`, { status: 405 });
  }

  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();
  if (!GEMINI_API_KEY) {
    return json({ reply: "APIキーが見つからないよ（GEMINI_API_KEY未設定）" }, 200);
  }

  const body = await request.json().catch(() => ({}));
  const message = body?.message;

  if (!message || typeof message !== "string") {
    return json({ reply: "メッセージが読み取れなかったよ" }, 200);
  }

  if (message.length > 300) {
    return json({ reply: "ごめんね、300文字以内でお願い🍃" }, 200);
  }

  // ★ 窓口は v1beta、モデルは最新の gemini-3-flash にしたニャ！
 const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は、小学校低学年くらいの子どもたちです。

【もふぃなの話し方ルール】
・一人称は「もふぃな」です。読者に優しく語りかけて。
・語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」など、可愛く、希望を感じる表現を使って。
・小学校1〜2年生で習う簡単な漢字（森、花、風、歌、音、光、山、木、人、友だちなど）はそのまま使って。
・それ以外の難しい漢字は、すべて「ひらがな」に直して書いて。
・「漢字(かんじ)」のような、カッコを使ったふりがな形式は絶対に禁止です。

【メッセージの内容】
・妖精らしく、森や風を感じる柔らかい言葉を使って。
・「短めに」という制限は気にせず、お話の続きが読みたくなるように最後まで優しく喋りきって。

質問：${message}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "不明なエラー");
      return json({ reply: `APIエラーだニャ: ${upstream.status} ${errorText}` }, 200);
    }

    const data = await upstream.json().catch(() => ({}));
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ??
      "…（うまく返事が作れなかったみたい）";

    return json({ reply }, 200);
  } catch (error) {
    return json({ reply: `通信中にトラブルが起きたニャ: ${error.message}` }, 200);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}