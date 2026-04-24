export const maxDuration = 30;

export async function POST(request) {
try {
const body = await request.json();
const { username, nicho, objetivo, bio, posts } = body;

```
const profileText = "Analise este perfil do Instagram. @: " + (username || "") + ". Nicho: " + (nicho || "") + ". Objetivo: " + (objetivo || "") + ". Bio: " + (bio || "nao informada") + ". Posts: " + (posts || "nao informado");

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: "Voce e especialista em marketing digital e Instagram. Responda APENAS com JSON valido sem markdown: {\"nota_geral\": <0-10>, \"resumo\": \"<texto>\", \"bio\": {\"nota\": <0-10>, \"pontos_fortes\": [\"<texto>\"], \"melhorias\": [\"<texto>\"], \"bio_reescrita\": \"<texto>\"}, \"conteudo\": {\"nota\": <0-10>, \"pontos_fortes\": [\"<texto>\"], \"melhorias\": [\"<texto>\"]}, \"posicionamento\": {\"nota\": <0-10>, \"analise\": \"<texto>\", \"diferenciais\": [\"<texto>\"]}, \"acoes_imediatas\": [\"<a1>\",\"<a2>\",\"<a3>\",\"<a4>\",\"<a5>\"]}",
    messages: [{ role: "user", content: profileText }],
  }),
});

const data = await response.json();

if (!data.content) {
  return Response.json({ error: "Erro da API" }, { status: 500 });
}

const text = data.content.map(b => b.text || "").join("");
const jsonMatch = text.match(/\{[\s\S]*\}/);

if (!jsonMatch) {
  return Response.json({ error: "Resposta invalida" }, { status: 500 });
}

const parsed = JSON.parse(jsonMatch[0]);
return Response.json(parsed);
```

} catch (error) {
return Response.json({ error: “Erro: “ + error.message }, { status: 500 });
}
}
