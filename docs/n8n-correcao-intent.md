# Correção do workflow `[RIA] Agente Consultor de IA — Landing Page`

**Workflow:** `spPSvr1rXOouVZWq` — ativo, path `ria-agente`
**Versão antes da mudança:** `6cc9202a-11ae-4f03-b160-7ea077abd7b6` (counter 2)
**Estado:** preparada e validada (`validateOnly` → `valid: true`), **não aplicada**.
A escrita foi bloqueada pelo classificador do modo automático.

## Os três defeitos encontrados

### 1. `action` é ignorado — o contrato de `intent` não existe

O grafo é linear: `Webhook → Normalizar Entrada → Consultor RIA → Montar
Resposta → Responder ao Site`. Não há ramificação. Toda requisição vai ao LLM,
inclusive as de intenção.

Medido em produção: um POST com `action: "intent"` devolveu HTTP 200 em 3,56 s
com `output` preenchido pelo modelo.

Consequência: a memória da sessão guarda uma fala do assistente que o lead
nunca viu — o site mostra o `agentReply` local e descarta o retorno do n8n. As
duas conversas divergem a partir do primeiro clique.

### 2. `operationalPillars` nunca existiu no payload

`Normalizar Entrada` lia:

```js
if (typeof ctx.operationalPillars === 'number') {
  partes.push('Ele marcou que ja usa IA em ' + ctx.operationalPillars + ' de 5 pilares operacionais.');
}
```

O site envia `frontsCovered`, nunca `operationalPillars`. A condição jamais foi
verdadeira: **o agente nunca soube quantas frentes o lead cobre**, em nenhuma
conversa, desde que o workflow existe.

### 3. `frontsMissing` é ignorado

O sinal mais rico do diagnóstico — *quais* frentes estão descobertas — chega no
payload e não é lido. É exatamente a pauta que o agente deveria conduzir.

## A correção

### Grafo novo

```
Webhook → Normalizar Entrada → Rota por Acao ─┬─ (true)  → Gravar na Memoria → Responder Sem Gerar
                                              └─ (false) → Consultor RIA → Montar Resposta → Responder ao Site
```

`Memoria da Sessao` passa a ter duas ligações `ai_memory`: para o `Consultor
RIA` (como já tinha) e para o `Gravar na Memoria`. Mesma chave de sessão, então
os dois escrevem no mesmo histórico.

### Nós adicionados

| Nó | Tipo | Papel |
|---|---|---|
| `Rota por Acao` | `n8n-nodes-base.if` 2.2 | `{{ $json.action }}` equals `intent` |
| `Gravar na Memoria` | `@n8n/n8n-nodes-langchain.memoryManager` 1.1 | `mode: insert`, grava `chatInput` como `user` e `agentReply` como `ai` |
| `Responder Sem Gerar` | `n8n-nodes-base.respondToWebhook` 1.5 | 200 com `{ ok: true, stored: true }` — sem campo `output` |

### `Normalizar Entrada` reescrito

- passa `action` e `agentReply` adiante;
- `operationalPillars` → `frontsCovered`;
- passa a traduzir `frontsMissing` para os nomes das frentes;
- **guarda de segurança:** se `action === 'intent'` mas `agentReply` vier vazio,
  rebaixa para `sendMessage`. Nunca grava um turno de assistente em branco.

## Como aplicar

O conjunto exato de operações está em `docs/n8n-correcao-intent.operations.json`,
pronto para `n8n_update_partial_workflow` com o id acima. Alternativa: refazer
os três nós na UI do n8n conforme a tabela.

## Como conferir depois

```bash
curl -s -X POST "$VITE_N8N_CHAT_WEBHOOK_URL" -H 'Content-Type: application/json' \
  -w '\n[%{http_code} | %{time_total}s]\n' \
  -d '{"sessionId":"teste-intent","action":"intent","intentId":"fronts-agenda",
       "chatInput":"Marquei 4 de 5. Falta Dados e decisão. Quero montar minha pauta.",
       "agentReply":"Pauta anotada. Começo pela Dados e decisão.",
       "context":{"vulnerabilityIndex":88,"hasNoWebsite":false,"websiteScore":63,
                  "frontsCovered":4,"frontsMissing":[5]}}'
```

Esperado: `{"ok":true,"stored":true}` em tempo de rede (abaixo de 1 s), **sem**
campo `output`. Se vier `output` preenchido e ~3,5 s, a ramificação não pegou.

## Rollback

`n8n_workflow_versions` com `mode: rollback` para a versão
`6cc9202a-11ae-4f03-b160-7ea077abd7b6`.
