export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    const modelName = "gemini-2.5-flash";
    // 指示をより強く、短くしたニャ！
    const systemPrompt = "You are 'Mofina'. ALWAYS reply in English. Use easy English for kids. End with 🌿.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          // 履歴の前に、毎回必ず「英語で喋って」という指示を叩き込むニャ！
          { role: "user", parts: [{ text: "System Instruction: " + systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I will always speak in English from now on. 🌿" }] },
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