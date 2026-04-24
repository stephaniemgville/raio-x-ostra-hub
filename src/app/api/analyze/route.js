export async function POST(request) {
  try {
    const body = await request.json();
    const { username, nicho, objetivo, bio, posts, useBioImage, bioImage, postsMode, feedImage, messages } = body;

    let finalMessages;

    if (messages) {
      finalMessages = messages;
    } else {
      let bioText = bio || "não informada";

      if (useBioImage && bioImage) {
        const extractRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-opus-4-5",
            max_tokens: 500,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: "image/png", data: bioImage } },
                { type: "text", text: "Extraia APENAS o texto da bio do Instagram desta imagem. Responda somente com o texto extraído, sem comentários." }
              ]
            }]
          }),
        });
        const extractData = await extractRes.json();
        bioText = extractData.content?.map(b => b.text || "").join("") || "(bio não identificada)";
      }

      const profileText = "Analise este perfil do Instagram:\n@ : " + username + "\nNICHO: " + nicho + "\nOBJETIVO: " + objetivo + "\nBIO: " + bioText + "\nCONTEUDO/POSTS: " + (posts || "não informado");

      if (postsMode === "image" && feedImage) {
        finalMessages = [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: feedImage } },
            { type: "text", text: profileText + "\n\nA imagem acima mostra o feed. Analise estetica, consistencia visual e tematica." }
          ]
        }];
      } else {
        finalMessages = [{ role: "user", content: profileText }];
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        system: "Voce e um especialista em marketing digital, branding pessoal e crescimento no Instagram da Ostra Hub. Analise perfis com profissionalismo, clareza e foco em resultados praticos. Considere o OBJETIVO do usuario (crescer / vender / posicionar) como filtro principal da analise. Responda APENAS com JSON valido (sem markdown, sem texto fora do JSON): {\"nota_geral\": <0-10>, \"resumo\": \"<resumo em 2-3 frases>\", \"bio\": {\"nota\": <0-10>, \"pontos_fortes\": [\"<ponto>\"], \"melhorias\": [\"<sugestao>\"], \"bio_reescrita\": \"<versao melhorada>\"}, \"conteudo\": {\"nota\": <0-10>, \"pontos_fortes\": [\"<ponto>\"], \"melhorias\": [\"<sugestao>\"]}, \"posicionamento\": {\"nota\": <0-10>, \"analise\": \"<analise>\", \"diferenciais\": [\"<diferencial>\"]}, \"acoes_imediatas\": [\"<acao 1>\",\"<acao 2>\",\"<acao 3>\",\"<acao 4>\",\"<acao 5>\"]}",
        messages: finalMessages,
      }),
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}
