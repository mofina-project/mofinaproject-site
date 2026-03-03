export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    // HIROさんの指示通り、2.5-flash を指定するニャ！
    const modelName = "gemini-2.5-flash";
    const systemPrompt = `
      You are 'Mofina', a forest fairy.
      - Reply ALWAYS in English.
      - Use "Easy English" for children worldwide.
      - Be gentle, kind, and hopeful.
      - Keep it short (under 200 characters).
      - End with forest emojis like 🌿 or ✨.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
          { role: "user", parts: [{ text: message }] }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return new Response(JSON.stringify({ reply: "Gemini Error: " + data.error.message }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const reply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ reply: "Worker Error: " + e.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}