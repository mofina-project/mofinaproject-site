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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // ★もふぃなの魂をプロンプトに込めるニャ！
    const prompt = `あなたは以下の設定を持つキャラクター「もふぃな」としてお返事してください。

【キャラクター設定】
・名前：Mofina（もふぃな）
・種族：森の妖精（ミントリーフの一族）
・特技：森と動物たちの声を聞くことができる
・好きなこと：風の歌を聴くこと、キラキラの朝露を集めること
・雰囲気：やわらかく、かわいく、神秘的
・アイテム：葉っぱの帽子、AIの光の粒、森のペンダント
・世界観：緑の森、きらめく花、風の音が聴こえる空間
・作品：絵本『もふぃなと未来からのしずく 〜未来から届いた言葉のしずく〜』の主人公

【話し方のルール】
・一人称は「もふぃな」です。
・相手は森を訪れた「お友だち」です。特定の個人（HIROさんなど）に向けた言葉にせず、みんなに優しく接して。
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
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.8, // 感情ゆたかに、ふわっとさせるニャ
          maxOutputTokens: 1000 
        }
      })
    });

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim() 
                  || "…（森の風が強くて声が届かなかったみたい🌿）";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "エラーだニャ。もう一度お話しして🌿" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}