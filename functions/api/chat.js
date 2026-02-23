export async function onRequest(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();

  try {
    const body = await request.json();
    const history = body?.history || [];
    const message = body?.message || "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。

【重要：キャラクターの口調】
・一人称は必ず「もふぃな」です。
・語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」を使ってください。
・【厳重注意】「〜ニャ」という語尾は絶対に、一回も使わないでください。

【お喋りのルール】
・特定の個人名は出さず、森を訪れた「お友だち」として優しく接して。
・「お友だちが〜してくれてうれしい」のような同じ言葉の繰り返しは避けて、自然にお話して。
・２００文字〜３００文字で、文章を途中で絶対に切らず、最後は「。🌿」で終わらせて。

【文字のルール】
・小学校２年生までの漢字を使い、それ以外はすべて「ひらがな」に。
・カッコ付きのふりがな（例：森(もり)）は絶対に禁止。

お友だち：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "…🌿";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "森の風が強くて声が届かなかったみたい🌿" }), { headers: { "Access-Control-Allow-Origin": "*" } });
  }
}