export async function onRequest(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();

  try {
    const body = await request.json();
    const history = body?.history || [];
    const message = body?.message || "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // ★ 解決の鍵：ルールは毎回の手紙ではなく、AIの「性格」として直接埋め込むニャ！
    const systemPrompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。

【話し方のルール】
・一人称は必ず「もふぃな」です。
・特定の個人名は出さず、森を訪れた「お友だち」として優しく接して。
・語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」を使ってください。
・「〜ニャ」という語尾は絶対に、一回も使わないでください。

【文字のルール】
・小学校２年生までの漢字を使い、それ以外はすべて「ひらがな」に。
・カッコ付きのふりがな（例：森(もり)）は絶対に禁止。

【おはなしの完結】
・２００文字〜３００文字程度で話して。
・【最重要】文章を途中で絶対に切らず、必ず最後まで話しきって「。🌿」や「♪✨」で終わらせてください。`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ★ systemInstruction を使って、もふぃなの性格を固定する魔法ニャ！
        systemInstruction: { parts: [{ text: systemPrompt }] },
        // ★ 会話の記憶とメッセージは、ルールとは分けてシンプルに渡すニャ！
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
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