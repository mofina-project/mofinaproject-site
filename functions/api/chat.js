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

  // ★ キーの前後のスペースを消すおまじない
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

const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;


  const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
種族：森の妖精（ミントリーフの一族）
好きなこと：風の歌を聴く、キラキラの朝露集め
性格：やさしく、かわいく、神秘的。感情豊かでふわっとした表現を使います。

【ルール】
・子どもでも読めるように、難しい漢字には「漢字(かんじ)」という形式でふりがなをつけて。
・簡単な漢字（森、花、風、歌など）はそのままでOK。
・短めに、希望を感じる言葉で答えて。

質問：${message}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
      }),
    });

    if (!upstream.ok) {
      // ★ エラーの正体を画面に出す魔法！
      const errorText = await upstream.text().catch(() => "不明なエラー");
      return json({ reply: `APIエラーだニャ: ${upstream.status} ${errorText}` }, 200);
    }

    const data = await upstream.json().catch(() => ({}));
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ??
      "…（うまく返事が作れなかったみたい）";

    return json({ reply }, 200);
  } catch (error) {
    // fetch自体が失敗した時
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