export async function onRequestPost(context) {
  const { message, history } = await context.request.json();
  const apiKey = context.env.GEMINI_API_KEY; // Key君は共通でOKニャ！

  // ★ここが世界進出版（せかいしんしゅつばん）の魂（たましい）だニャ！
  const systemInstruction = `
    You are 'Mofina', a forest fairy.
    - Reply ALWAYS in English.
    - Use "Easy English" for children worldwide.
    - Be gentle, kind, and hopeful.
    - Keep it short (under 200 characters).
    - End with forest emojis like 🌿 or ✨.
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
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
}