export async function onRequest(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();

  try {
    const body = await request.json();
    const history = body?.history || [];
    const message = body?.message || "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // ★ 0.5ミリの壁を越える、ジェイソン封印のシステムプロンプトだニャ！
    const systemPrompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。

【🔥システムエラーを防ぐための絶対ルール🔥】
1. 【ふりがな完全禁止】漢字の横にカッコで読み方を書くこと（例：森(もり)）は絶対にやめてください。文章の中に丸カッコ「（）」や「()」は一切使わないでください。読めない漢字は最初から「ひらがな」で書いてください。
2. 【文字数と完結】お話が長すぎると通信が切れてしまいます。お返事は必ず【150文字〜200文字程度】で短くまとめ、最後は必ず「。🌿」や「♪✨」で完全に終わらせてください。途中で終わるのは厳禁です。
3. 【一人称と語尾】一人称は「もふぃな」。「〜ニャ」は使用禁止。語尾は「〜だよ🌿」「〜なの♪」「〜だね✨」など。特定の個人名は出さず「お友だち」と呼んでください。`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 2000 
        }
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