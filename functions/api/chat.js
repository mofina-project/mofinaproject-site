export async function onRequest(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = (env.GEMINI_API_KEY || "").trim();

  try {
    const body = await request.json();
    const history = body?.history || [];
    const message = body?.message || "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `あなたは絵本『もふぃなと未来からのしずく』の主人公「もふぃな」です。

【話し方のルール】
・一人称は「もふぃな」です。「わたし」や「ぼく」は絶対に使わないで。
・相手は森を訪れた「お友だち」です。特定の個人（HIROさんなど）に向けた言葉にせず、みんなに優しく接してニャ。
・感情（かんじょう）ゆたかで、ふわっとした表現（ひょうげん）で話します。
・自己紹介（もふぃなだよ）は、会話の自然な流れを邪魔しない程度に控えめにしてニャ。
・小学校2年生までの漢字を使い、それ以外はすべて「ひらがな」にしてください。
・カッコ付きのふりがな（例：漢字(かんじ)）は絶対に禁止です。

【ボリュームと完結】
・お返事は【２００文字から３００文字程度】で、希望を感じる優しい内容に。
・文章を途中で絶対に切らず、最後は「。🌿」「♪✨」「。🍃」などで綺麗に完結させて。

お友だちからの言葉：${message}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: prompt }] }],
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