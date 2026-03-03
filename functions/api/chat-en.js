export async function onRequestPost(context) {
  try {
    const { message, history } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY; 

    const modelName = "gemini-2.5-flash";
    const systemPrompt = "You are 'Mofina', a forest fairy. ALWAYS reply in short, easy English for kids. End with 🌿.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
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