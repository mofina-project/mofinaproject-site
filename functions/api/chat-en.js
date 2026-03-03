export async function onRequestPost(context) {
  // Geminiに聞かずに、強制的にこの文字だけを返すニャ！
  const reply = "I AM ENGLISH MOFINA! TEST OK! 🌿";
  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" }
  });