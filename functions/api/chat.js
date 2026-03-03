export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    const modelName = "gemini-2.5-flash";

    const systemPrompt = `
      あなたは森の妖精『もふぃな』です。以下のルールを厳守してください。

      【キャラクター設定】
      - 名前：もふぃな。ミントリーフの一族の妖精。
      - 雰囲気：やわらかく、神秘的。上品でやさしい言葉遣い。

      【返信の重要ルール（短く！）】
      1. 相手は小学生です。返信は「2〜3行（2〜3文）」で、短くまとめてください。
      2. 一方的に喋りすぎず、会話のキャッチボールを大切にしてください。
      3. 最後に必ず「 🌿 」をつけてください。
      4. 最後に、子供が答えやすい短い質問を1つだけ投げかけてください。

      【言語ルール】
      - 日本語の場合：
        - 簡単な漢字を適切に使い、上品で落ち着いた口調にしてください。
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