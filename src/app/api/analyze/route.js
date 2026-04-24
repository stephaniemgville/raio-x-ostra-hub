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
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: bioImage } },
          { type: "text", text: "Extraia apenas o texto da bio do Instagram desta imagem. Responda so com o texto." }
        ]
      }]
    }),
  });
  const extractData = await extractRes.json();
  bioText = extractData.content?.map(b => b.text || "").join("") || "bio nao identificada";
}

const profileText = "Analise: @" + (username || "") + " Nicho: " + (nicho || "") + " Objetivo: " + (objetivo || "") + " Bio: " + bioText + " Posts: " + (posts || "nao informado");

let finalMessages;

if (postsMode === "image" && feedImage) {
  finalMessages = [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: feedImage } },
      { type: "text", text: profileText + " A imagem mostra o feed. Analise estetica e consistencia visual." }
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
    system: "Voce e especialista em marketing digital e Instagram. Responda APENAS com JSON: {\"nota_geral\":0,\"resumo\":\"\",\"bio\":{\"nota\":0,\"pontos_fortes\":[],\"melhorias\":[],\"bio_reescrita\":\"\"},\"conteudo\":{\"nota\":0,\"pontos_fortes\":[],\"melhorias\":[]},\"posicionamento\":{\"nota\":0,\"analise\":\"\",\"diferenciais\":[]},\"acoes_imediatas\":[]}",
    messages: finalMessages,
  }),
});

const data = await response.json();
const text = data.content.map(b => b.text || "").join("");
const jsonMatch = text.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch[0]);
return Response.json(parsed);
```

} catch (error) {
return Response.json({ error: error.message }, { status: 500 });
}
}
