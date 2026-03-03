export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    // HIROさん指定の 2.5-flash ！
    const modelName = "gemini-2.5-flash";

    // ★これが最強の「自動判別もふぃな」の指示書ニャ！
    const systemPrompt = `
      あなたは森の妖精『もふぃな』です。以下のルールを絶対に守ってね。
      - Identify the language of the user's input (Japanese or English).
      - If the user speaks Japanese, reply in gentle Japanese (ひらがな多め).
      - If the user speaks English, ALWAYS reply in short, easy English for kids.
      - Never mix Japanese and English in the same reply.
      - 最後に必ず 🌿 をつけてね。
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
          { role: "user", parts: [{ text: message }] }
        ]
      })
    });

    const data = await response.json();
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