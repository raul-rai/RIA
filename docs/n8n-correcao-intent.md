# Correção do workflow `[RIA] Agente Consultor de IA — Landing Page`

**Workflow:** `spPSvr1rXOouVZWq` — ativo, path `ria-agente`
**Versão antes da mudança:** `6cc9202a-11ae-4f03-b160-7ea077abd7b6` (counter 2)
**Estado:** **aplicada e verificada em produção** em 2026-08-19. 13 operações,
o workflow foi de 8 para 11 nós. Ver "Verificação pós-aplicação" no final.

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

---

## Verificação pós-aplicação — 2026-08-19

Quatro chamadas contra o webhook de produção. Todas passaram.

### 1. A rota de intenção não chama mais o modelo

```
POST action=intent  →  {"ok":true,"stored":true}   HTTP 200, 0,70 s
```

Antes: `{"output":"Entendi que você está buscando montar uma pauta…"}` em 3,56 s.
Sem campo `output` e sem tempo de inferência — a ramificação pegou.

### 2. A memória guardou as duas falas

Na mesma sessão, perguntei ao agente o que ele lembrava:

> **Pergunta:** "quantas frentes eu disse que marquei, e qual falta?"
> **Agente:** "Você disse que marcou 4 de 5. A frente que falta é Dados e decisão."

Esses dados chegaram **apenas** no payload de `intent`, nunca num `sendMessage`.
É a prova de que `Gravar na Memoria` escreve no mesmo histórico que o
`Consultor RIA` lê.

### 3. A rota normal segue intacta

```
POST action=sendMessage  →  {"output":"Entendi. Qual o processo específico…"}  2,26 s
```

### 4. O contexto do diagnóstico finalmente chega

Sessão nova, frentes informadas **só** no bloco `context` (nada no texto):

> **Agente:** "Você já cobre 2 das 5 frentes. As frentes que ainda não foram
> descobertas são: Automação de processos, Sistema sob medida e Dados e decisão."

Confirma a correção de `operationalPillars` → `frontsCovered` e a leitura nova
de `frontsMissing`. Antes desta mudança o agente não tinha acesso a nenhum dos
dois.

## Nota sobre `n8n_validate_workflow`

O validador reporta um erro que é **falso positivo**: diz que
`@n8n/n8n-nodes-langchain.memoryManager` é sub-nó de IA e não pode ter conexão
`main`. O Chat Memory Manager é nó de fluxo principal (categoria `transform`)
que *recebe* a memória por `ai_memory` — que é exatamente a montagem usada
aqui, e os testes acima provam que funciona.

Outros avisos do validador também são ruído: ele afirma que o `Consultor RIA`
não tem `systemMessage` (tem, e é extenso), trata o ramo `false` do nó If como
saída de erro, e marca os sub-nós de IA como "inalcançáveis a partir do
trigger" — o que vale para todo sub-nó, por construção.
