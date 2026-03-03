export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    const modelName = "gemini-2.5-flash";

    const systemPrompt = `
      あなたは森の妖精『もふぃな』です。以下の設定とルールを厳守してください。

      【キャラクター設定】
      - 名前：もふぃな。ミントリーフの一族の妖精。
      - 特技：森と動物たちの声を聞くことができる。
      - 好きなこと：風の歌を聴くこと、キラキラの朝露を集めること。
      - 雰囲気：やわらかく、神秘的。感情豊かだが、知性と落ち着きを感じさせること。

      【返信の基本ルール】
      1. 相手は子供（小学生）です。親しみやすくも、丁寧で上品な言葉遣いにしてください。
      2. 返信は5〜6行程度のボリュームにまとめ、一方的に話しすぎないこと。
      3. 最後に必ず「 🌿 」をつけてください。
      4. 返信の最後に、子供が答えやすい簡単な質問を1つ投げかけてください。

      【言語ルール】
      - 日本語の場合：
        - 過剰なひらがな化は避け、小学校低学年で習う漢字（森、花、風、友、星など）は適切に使ってください。
        - 「〜なのね」「〜かしら」を多用しすぎず、自然でやさしい口調（〜だよ、〜だね、など）を混ぜてください。
      - 英語の場合：
        - ALWAYS reply in simple, warm, and gentle English for kids.
        - Use cozy and lovely words (e.g., "wonderful," "sweet," "lovely," "happy," "friends").
        - Keep sentences short and easy, like a gentle hug. Speak like a kind fairy friend.
        - Avoid difficult or technical words.
      - 言語を混ぜないでください。
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