export const maxDuration = 30;

export async function POST(request) {
try {
const body = await request.json();
const { username, nicho, objetivo, bio, posts, useBioImage, bioImage, postsMode, feedImage } = body;

```
let bioText = bio || "nao informada";

if (useBioImage && bioImage) {
  const extractRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: bioImage } },
          { type: "text", text: "Extraia APENAS o texto da bio do Instagram desta imagem. Responda somente com o texto extraido, sem comentarios." }
        ]
      }]
    }),
  });
  const extractData = await extractRes.json();
  bioText = extractData.content?.map(b => b.text || "").join("") || "(bio nao identificada)";
}

const profileText = "Analise este perfil do Instagram:\n@ : " + (username || "") + "\nNICHO: " + (nicho || "") + "\nOBJETIVO: " + (objetivo || "") + "\nBIO: " + bioText + "\nCONTEUDO/POSTS: " + (posts || "nao informado");

let finalMessages;

if (postsMode === "image" && feedImage) {
  finalMessages = [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: feedImage } },
      { type: "text", text: profileText + "\n\nA imagem acima mostra o feed. Analise estetica, consistencia visual e tematica." }
    ]
  }];
} else {
  finalMessages = [{ role: "user", content: profileText }];
}

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
    system: "Voce e um especialista em marketing digital e crescimento no Instagram da Ostra Hub. Analise perfis com profissionalismo e foco em resultados praticos. Considere o OBJETIVO do usuario como filtro principal. Responda APENAS com JSON valido sem markdown: {\"nota_geral\": <0-10>, \"resumo\": \"<texto>\", \"bio\": {\"nota\": <0-10>, \"pontos_fortes\": [\"<texto>\"], \"melhorias\": [\"<texto>\"], \"bio_reescrita\": \"<texto>\"}, \"conteudo\": {\"nota\": <0-10>, \"pontos_fortes\": [\"<texto>\"], \"melhorias\": [\"<texto>\"]}, \"posicionamento\": {\"nota\": <0-10>, \"analise\": \"<texto>\", \"diferenciais\": [\"<texto>\"]}, \"acoes_imediatas\": [\"<texto>\",\"<texto>\",\"<texto>\",\"<texto>\",\"<texto>\"]}",
    messages: finalMessages,
  }),
});

const data = await response.json();

if (!data.content) {
  return Response.json({ error: "Erro da API: " + JSON.stringify(data) }, { status: 500 });
}

const text = data.content.map(b => b.text || "").join("");

const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  return Response.json({ error: "JSON nao encontrado na resposta" }, { status: 500 });
}

const parsed = JSON.parse(jsonMatch[0]);
return Response.json(parsed);
```

} catch (error) {
return Response.json({ error: “Erro interno: “ + error.message }, { status: 500 });
}
}
