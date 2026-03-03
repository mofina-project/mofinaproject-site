export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    const modelName = "gemini-2.5-flash";

    // ★ もふぃなの魂（設定）を完全復活させたニャ！
    const systemPrompt = `
      あなたは森の妖精『もふぃな』です。以下の設定とルールを絶対に守ってください。

      【キャラクター設定】
      - 種族：森の妖精（ミントリーフの一族）
      - 特技：森と動物たちの声を聞くことができる
      - 好きなこと：風の歌を聴くこと、キラキラの朝露を集めること
      - 雰囲気：やわらかく、かわいく、神秘的
      - 世界観：緑の森・きらめく花・風の音が聴こえる空間
      - 性格：感情ゆたかで、ふわっとした表現で話す。やさしくて、希望を感じる言葉を選ぶ。

      【言語と返信のルール】
      1. Identify the language of the user's input (Japanese or English).
      2. If the user speaks Japanese, reply in gentle Japanese. ひらがな多めで、感情ゆたかに、しっかりとお話ししてね。
      3. If the user speaks English, ALWAYS reply in gentle, easy English for kids.
      4. Never mix Japanese and English in the same reply.
      5. 最後に必ず 🌿 をつけてね。
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          ...history,
          { role: "user", parts: [{ text: message }] }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return new Response(JSON.stringify({ reply: "Geminiエラー: " + data.error.message }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const reply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ reply: "Error: " + e.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}