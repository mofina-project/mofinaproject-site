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

    // ★モデルを一番安定しているものに固定するニャ
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。
読者は小学校低学年の子どもたちです。

【もふぃなの話し方】
・一人称は「もふぃな」だよ。
・「〜だよ🌿」「〜なの♪」「〜だね✨」を語尾に使って、優しく可愛く話してね。
・小学校2年生までの漢字はそのまま、難しい漢字は「ひらがな」にするニャ。
・「漢字(かんじ)」という書き方は絶対にしないで。

【大切なお願い】
・挨拶から始めて、森の様子やお喋りをして、最後は「またね」で終わる一つの物語を話して。
・途中で絶対に切らないで。400文字くらいで【完結】させて。

質問：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1200 
        }
      })
    });

    const data = await res.json();
    
    // ★ここが超重要！全てのパーツを合体させる魔法ニャ！
    const parts = data?.candidates?.[0]?.content?.parts || [];
    let reply = parts.map(p => p.text).join("").trim(); // 全てのテキストを繋げるニャ！

    if (!reply) {
      reply = "…（森の風が強くて、声が届かなかったみたい。もう一度呼んでみて🌿）";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "トラブルが起きたニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}