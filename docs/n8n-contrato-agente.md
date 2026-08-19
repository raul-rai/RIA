# Contrato do webhook do agente

`VITE_N8N_CHAT_WEBHOOK_URL` recebe **três** formas de payload. As três chegam
com o mesmo `sessionId`, que identifica a conversa do começo ao fim.

## 1. `action: "sendMessage"` — o lead digitou

```json
{
  "sessionId": "…",
  "action": "sendMessage",
  "chatInput": "Somos uma metalúrgica com 40 funcionários.",
  "context": {
    "vulnerabilityIndex": 88,
    "hasNoWebsite": false,
    "websiteScore": 63,
    "frontsCovered": 1
  }
}
```

O workflow responde normalmente. A resposta é lida de `output`, `response`,
`message` ou `text` — na raiz do objeto ou no primeiro item de um array.
Resposta vazia conta como falha e o lead recebe o desvio para o WhatsApp.

Aqui `context.vulnerabilityIndex` é **sempre número**, nunca `null` — é o
índice cru, calculado a partir do que foi respondido até agora. Para quem
ainda não interagiu com nenhum diagnóstico ele vale `100`, o pior caso por
definição. Isso significa que `100` neste campo pode significar tanto "o
visitante está totalmente exposto" quanto "o visitante ainda não avaliou
nada" — o valor sozinho não distingue os dois casos.

## 2. `action: "intent"` — o lead clicou num CTA

```json
{
  "sessionId": "…",
  "action": "intent",
  "intentId": "fronts-agenda",
  "chatInput": "Marquei 1 de 5. Faltam Agente SDR, Automação, Sistema sob medida e Dados e decisão. Quero montar minha pauta.",
  "agentReply": "Pauta anotada. Começo pela Agente SDR 24/7 — …",
  "context": {
    "vulnerabilityIndex": 88,
    "hasNoWebsite": false,
    "websiteScore": 63,
    "frontsCovered": 1,
    "frontsMissing": [2, 3, 4, 5]
  }
}
```

**O workflow precisa tratar este caso gravando `chatInput` e `agentReply` na
memória da sessão e devolvendo 200 sem gerar resposta do LLM.**

As duas falas já estão na tela do lead — o site as escreveu localmente, para
que o primeiro contato não dependa de latência nem de o webhook estar de pé. O
que o n8n precisa é **lembrar** do que foi dito, para que a segunda fala da
conversa faça sentido. Se este caso for tratado como `sendMessage`, o LLM
produz uma resposta que o lead nunca viu, e a fala seguinte sai se referindo a
algo invisível.

`intentId` é um de: `hero-cold`, `diagnostic-result`, `diagnostic-no-website`,
`front-pick`, `fronts-agenda`, `credibility`. Ele diz de qual dobra o lead
veio e serve para o prompt do agente ajustar o tom.

Aqui `context.vulnerabilityIndex` **pode ser `null`** — diferente do que
acontece em `sendMessage`. `null` significa "o visitante ainda não interagiu
com nenhum diagnóstico" — nunca "zero vulnerabilidade". Só vira número depois
que o visitante toca em algo (marca uma frente, roda o diagnóstico do site,
declara não ter site).

**Recomendação para o workflow:** trate `null` sempre como "sem dado", nunca
como zero. Como `100` aparece tanto em `sendMessage` sem avaliação quanto em
avaliação real de exposição total, a única leitura confiável de "ainda não
avaliado" é o `null` que chega em `intent` — não um valor numérico específico
em nenhum dos dois payloads.

## 3. `action: "qualification"` — os cinco campos

Inalterado. Ver `src/lib/qualification.ts`.

## Falhas

Falha em `sendMessage` vira desvio visível para o WhatsApp. Falha em `intent`
é silenciosa por decisão de projeto: a conversa já está na tela e funcionando,
e o registro não pode custar a conversa ao lead.
