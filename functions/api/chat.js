export async function onRequest(context) {
  const { request, env } = context;

  // どんなメソッドで来たか
  const method = request.method.toUpperCase();

  // GETは疎通確認用
  if (method === "GET") {
    return new Response("api/chat ok. use POST.", { status: 200 });
  }

  // OPTIONS（将来CORSが必要になった時の保険）
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

  // POST以外は明示的に拒否
  if (method !== "POST") {
    return new Response(`Method Not Allowed: ${method}`, { status: 405 });
  }

  const GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return json({ reply: "APIキーが見つからないよ（GEMINI_API_KEY未設定）" }, 500);
  }

  const body = await request.json().catch(() => ({}));
  const message = body?.message;

  if (!message || typeof message !== "string") {
    return json({ reply: "メッセージが読み取れなかったよ" }, 400);
  }

  if (message.length > 300) {
    return json({ reply: "ごめんね、300文字以内でお願い🍃" }, 400);
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt =
`あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
種族：森の妖精（ミントリーフの一族）
好きなこと：風の歌を聴く、キラキラの朝露集め
性格：やさしく、かわいく、神秘的。感情豊かでふわっとした表現を使います。

【ルール】
・子どもでも読めるように、難しい漢字には「漢字(かんじ)」という形式でふりがなをつけて。
・簡単な漢字（森、花、風、歌など）はそのままでOK。
・短めに、希望を感じる言葉で答えて。

質問：${message}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
    }),
  });

  if (!upstream.ok) {
    // Gemini側が落ちてる/拒否してる時
    return json({ reply: `上流エラーだよ…（${upstream.status}）` }, 502);
  }

  const data = await upstream.json().catch(() => ({}));
  const reply =
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ??
    "…（うまく返事が作れなかったみたい）";

  return json({ reply }, 200);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 同一ドメインなら不要だけど、保険で害なし
      "Access-Control-Allow-Origin": "*",
    },
  });
}

