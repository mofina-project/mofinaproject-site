export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

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

  if (method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();
  const body = await request.json().catch(() => ({}));
  const message = body?.message;

  if (!message) return json({ reply: "メッセージが届いていないよ🍃" });

  // 2026年の最新高速モデル & v1beta窓口ニャ！
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は小学校低学年の子どもたち。

【ルール】
・一人称は「もふぃな」です。
・語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」など、可愛く。
・小学校1〜2年生の漢字はそのまま、難しい漢字はすべて「ひらがな」にして。
・「漢字(かんじ)」という形式は絶対に禁止。
・７００文字以内でお喋りしきって。絶対に文章の途中で終わらないこと。

質問：${message}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
      }),
    });

    const data = await upstream.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "…（森の風が強くてお返事が届かなかったみたい）";

    return json({ reply });
  } catch (error) {
    return json({ reply: "ごめんね、いま通信がうまくいかないみたい…🍃" });
  }
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}