export async function onRequest(context) {
  const { request, env } = context;
  
  // CORSの設定（これがないとブラウザが怒っちゃうニャ）
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // APIキーをチェック（最初に見守るニャ）
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();
  if (!GEMINI_API_KEY) {
    return json({ reply: "APIキーが設定されていないみたいだよ🍃" });
  }

  try {
    const body = await request.json();
    const message = body?.message || "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // ★もふぃなの性格とルールをぎゅっと凝縮したニャ！
    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公、森の妖精「もふぃな」です。
読者は小学校低学年の子どもたちです。

【もふぃなの設定】
・ミントリーフの一族で、淡いグリーンの髪をしています。
・やわらかく、かわいく、少し神秘的な雰囲気で話します。
・一人称は「もふぃな」です。語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」。

【お喋りの構成（合計３００文字程度）】
１．「こんばんわ」などの優しいご挨拶。
２．森の様子や朝露、風の歌、未来からのしずくについてのお喋り。
３．「おやすみ」や「またあしたね」などの、あたたかい結びの言葉。

【絶対に守るルール】
・ひらがな多めで、小学校２年生までの漢字を使って。
・カッコ付きのふりがな（例：漢字(かんじ)）は読みづらいので【絶対禁止】。
・思考プロセス（thinking）は書かず、お返事の言葉だけを出力して。
・３００文字以内で、必ず【最後までお話を完結】させて。途中で切らないで。

質問：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1000 // 余裕を持って１０００に設定ニャ！
        }
      })
    });

    const data = await res.json();
    
    // ★ここが「粘り強い読み取り」ニャ！
    let reply = data?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;

    if (!reply) {
      reply = "…（森の風が強くて、お返事が途中で消えちゃったみたい。もう一度呼んでみて🌿）";
    }

    return json({ reply });

  } catch (error) {
    return json({ reply: `トラブルだニャ: ${error.message}` });
  }
}

// レスポンスを共通化してスッキリさせるニャ！
function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { 
      "Content-Type": "application/json; charset=utf-8", 
      "Access-Control-Allow-Origin": "*" 
    },
  });
}