# A Travessia — reestruturação do storytelling da landing page

**Data:** 2026-08-18
**Branch de origem:** `feat/premium-overhaul`
**Decisões validadas com:** Raul (brainstorming)

---

## 1. Problema

A página acumulou alterações até perder a linha narrativa. As três primeiras dobras funcionam; da quarta em diante cada seção responde a uma pergunta que o visitante ainda não fez, e o final não converte no que o site existe para converter.

Diagnóstico do estado atual (7 dobras):

| Dobra | Conteúdo | Falha |
|---|---|---|
| 0 | Hero / onda 3D — "O Tsunami da IA" | — funciona |
| 1 | Vozes do mercado (3 autoridades) | — funciona |
| 2 | Diagnóstico de presença digital → Índice de Vulnerabilidade | — funciona; é o pico de tensão |
| 3 | Retorno auditável / casos | Reversão de risco entregue cedo demais; interrompe a tensão |
| 4 | Checklist de IA operacional | Segundo autodiagnóstico seguido; na verdade é o catálogo disfarçado de quiz |
| 5 | Seu consultor | Autoridade tardia e genérica; nome e credencial divergem da realidade |
| 6 | Oferta + agente lado a lado | Três saídas competindo; conversão é link de WhatsApp com dados parciais |

Duas falhas estruturais atravessam a página inteira:

1. **A página nunca declara a oferta.** Site, sistema, agente SDR e automação só aparecem implícitos no checklist. O visitante sai sem saber o que se compra.
2. **Não existe agendamento nem qualificação.** O objetivo do site — sessão estratégica gratuita de 30 minutos com dados prévios do lead — não tem mecanismo. Nenhum campo captura empresa, e-mail, telefone, faturamento ou budget de IA.

## 2. Objetivo

Converter visitante em **sessão estratégica gratuita de 30 minutos agendada**, com cinco dados capturados antes do agendamento: empresa, e-mail, telefone, faturamento mensal e budget destinado a IA.

Critério de sucesso: um visitante que chega ao fim da página tem horário marcado, e o Raul recebe os cinco campos mais o contexto acumulado (índice de vulnerabilidade, nota do site, frentes já cobertas) antes da conversa começar.

## 3. A espinha narrativa

> Uma onda está chegando **(0)** → e não sou só eu dizendo **(1)** → a sua empresa está exposta, e aqui está a nota **(2)** → existem 5 frentes para atravessar, e as suas estão vazias **(3)** → já atravessei com outros, dá para auditar, e quem faz sou eu **(4)** → o agente monta sua pauta e marca a sessão **(5)**

Arco emocional: ameaça → validação externa → **tensão pessoal (um número sobre a empresa dele)** → caminho → confiança → ação.

A correção central é o degrau entre *tensão* e *caminho*. Hoje a página sobe a tensão na dobra 2 e responde com metodologia de ROI. Passa a responder com o catálogo: aqui estão as cinco frentes, e as suas estão vazias.

Seis dobras, nesta ordem:

| # | Dobra | Papel narrativo |
|---|---|---|
| 0 | A onda | Ameaça / registro |
| 1 | Vozes do mercado | Validação externa |
| 2 | Diagnóstico de presença digital | Tensão pessoal (número) |
| 3 | As 5 frentes | Caminho / catálogo |
| 4 | Prova + quem executa | Confiança + reversão de risco |
| 5 | O agente e a agenda | Ação |

## 4. Dobra a dobra

### 4.0 — A onda (inalterada)

Onda 3D, headline com variantes por `?ref=`, CTA magnético. Nenhuma mudança de conteúdo. O CTA do hero continua saltando para a dobra do agente.

### 4.1 — Vozes do mercado (inalterada)

Três autoridades, acordeão no mobile e cartões no desktop, estado compartilhado no `VulnerabilityContext`.

### 4.2 — Diagnóstico de presença digital

Mecânica preservada: auditoria do site via PageSpeed com fallback n8n, ou declaração de "não tenho site" → índice 101%.

**Única mudança — a saída.** Hoje o resultado oferece "Resolver com a RIA" e salta direto para o final, atropelando o miolo. Passa a apontar para a dobra 3:

> "O site é a primeira das cinco frentes. Veja as outras quatro."

O resultado (nota, ou ausência de site) segue no contexto para pré-preencher a dobra 3.

### 4.3 — As 5 frentes

Substitui `OperationalAIChecklist`. A mecânica de marcação é preservada — o visitante marca o que a operação dele já executa. O conteúdo passa a ser o catálogo real:

| # | Frente | Promessa |
|---|---|---|
| 1 | Presença digital pronta para IA | Site que ChatGPT, Gemini e Perplexity conseguem citar |
| 2 | Agente SDR 24/7 | Responde, qualifica e agenda sozinho |
| 3 | Automação de processos | Rotinas repetitivas saem da mão da equipe |
| 4 | Sistema sob medida | O software que a operação precisa e não existe pronto |
| 5 | Dados e decisão | Números que dizem o que fazer, não o que aconteceu |

**Acoplamento com a dobra 2:** a frente 1 chega pré-resolvida pelo diagnóstico, por uma regra única:

- declarou não ter site, ou `websiteScore < 70` → item 1 **vazio e destacado**, citando a nota
- `websiteScore >= 70` → item 1 **já marcado**
- não fez o diagnóstico → item 1 neutro, como os outros quatro

Essa costura hoje não existe.

**Saída da dobra:** contagem viva — "Você tem 2 de 5. As 3 que faltam são a pauta da sua sessão." — e um CTA que desce para o agente.

### 4.4 — Prova + quem executa

Funde `ProofSection` e `ConsultantSection` num único `CredibilitySection`. Para consultor solo, "isso funciona" e "quem faz sou eu" são a mesma prova; hoje estão em duas dobras e nenhuma das duas fecha.

**Casos, etiquetados pela frente que provam** — é isso que costura com a dobra 3:

| Caso | Prova a frente |
|---|---|
| Nexa Interiores | 1 — Presença digital |
| Libra Crédito | 2 — Agente SDR |
| DecorColorir | 4 — Sistema sob medida |

**Faixa "Como medimos"** (medimos antes → um gargalo por vez → prazo na proposta → medimos depois) como reversão de risco, agora colada na oferta em vez de solta no meio da tensão.

**Bloco do consultor** fechando a dobra: retrato, nome, papel e credenciais. A bio é reescrita em torno do argumento real — engenharia de produção é a formação de quem entende gargalo e processo antes de entender modelo.

Um único CTA na dobra, apontando para o agente.

### 4.5 — O agente e a agenda

Reconstrói `SceneCTA`. Hoje são duas peças concorrendo pelo clique (card de oferta e chat), mais o FAB do WhatsApp. Passa a ser um caminho só.

A oferta deixa de ser cartão lado a lado e vira **faixa compacta de contexto** (o que é / o que sai / investimento / o que não acontece) acima do agente: informação disponível, sem disputar a ação.

**O agente em três estágios:**

1. **Conversa** — livre, sobre a operação. Comportamento atual, via webhook n8n. A saudação continua variando conforme o visitante tenha site ou não.
2. **Qualificação** — o gatilho é determinístico, não depende do LLM decidir: toda resposta do agente traz abaixo dela um botão persistente **"Agendar minha sessão de 30 min"**. Clicar nele inicia a qualificação. Cinco passos, um por vez, apresentados como micro-inputs dentro da bolha do chat: empresa → e-mail → telefone → faturamento mensal (faixas) → budget de IA (faixas). Indicador de progresso discreto ("3 de 5"). O visitante pode voltar um passo; não pode pular.
3. **Agenda** — embed abre na própria página, com nome e e-mail pré-preenchidos.

**Decisão técnica:** os cinco campos são capturados pelo front, não extraídos do texto livre pelo LLM. O agente conversa; o dado estruturado entra por input controlado. Extração por LLM de telefone e faturamento erra, e esse é exatamente o dado que não pode chegar sujo. Faturamento e budget entram como faixas (chips), não campo livre — reduz atrito e evita normalização de moeda.

**WhatsApp** permanece como fallback de falha do agente (comportamento `handoff` já existente) e como FAB nas dobras anteriores. Deixa de ser o caminho de conversão. O FAB continua oculto na dobra do agente.

**Payload enviado ao n8n na conclusão:** os cinco campos + índice de vulnerabilidade + nota do site (ou ausência de site) + quais das cinco frentes o visitante marcou.

## 5. Componentes

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Novo | `src/components/QualificationFlow.tsx` | Os cinco passos inline; valida e emite o objeto completo |
| Novo | `src/components/BookingEmbed.tsx` | Embed da agenda, atrás de interface agnóstica de provedor |
| Novo | `src/components/CredibilitySection.tsx` | Casos + como medimos + consultor |
| Novo | `src/content/fronts.ts` | As cinco frentes e o mapeamento caso → frente |
| Reescreve | `src/components/AIChatAgent.tsx` | Passa a orquestrar três estágios |
| Renomeia | `OperationalAIChecklist.tsx` → `FiveFronts.tsx` | Catálogo com marcação |
| Remove | `ProofSection.tsx`, `ConsultantSection.tsx` | Absorvidos por `CredibilitySection` |
| Compacta | `OfferSection.tsx` | Cartão → faixa horizontal de quatro termos |
| Estende | `src/context/VulnerabilityContext.tsx` | Guarda qualificação e frentes marcadas |
| Ajusta | `src/pages/LandingPage.tsx` | `CHAPTERS` de 7 → 6; `CTA_CHAPTER` de 6 → 5 |
| Ajusta | `src/content/consultant.ts` | Nome, papel e credenciais |
| Ajusta | `src/content/cases.ts` | Campo `front` ligando cada caso a uma frente |

**Fronteiras.** `QualificationFlow` não conhece o agente: recebe um callback de conclusão e devolve os cinco campos. `BookingEmbed` não conhece a qualificação: recebe nome e e-mail e renderiza a agenda. `AIChatAgent` orquestra os três estágios sem saber como cada um funciona por dentro. Trocar o provedor de agenda toca um arquivo.

## 6. Fluxo de dados

`VulnerabilityContext` é a fonte única do que o visitante revelou ao longo da página. Ganha:

- `qualification: { company, email, phone, revenue, aiBudget } | null`
- `operationalAIChecks` renomeado para `frontsChecked`

Sentido da dependência entre dobras:

```
dobra 2 (nota do site / sem site)
        └─> dobra 3 (pré-marca a frente 1)
                    └─> dobra 5 (frentes vazias = pauta da sessão)
dobra 5 (qualificação) ──> payload n8n + agenda
```

Nenhuma dobra lê estado de uma dobra posterior.

## 7. Erros e degradação

| Falha | Comportamento |
|---|---|
| Webhook do agente fora do ar | Mensagem de handoff + botão WhatsApp com todo o contexto já coletado (atual, preservado) |
| Embed da agenda não carrega | Fallback para WhatsApp com os cinco campos na mensagem |
| Visitante abandona no meio da qualificação | Estado preservado no contexto; retomar não recomeça do zero |
| PageSpeed indisponível na dobra 2 | Fallback n8n (atual) |
| Caso sem linha de apuração em `cases.ts` | Cartão não imprime linha de medição (atual). A afirmação de auditabilidade vive na faixa "Como medimos", não no cartão |

## 8. Testes

- `tests/config.test.ts` já garante que nenhuma URL de serviço viva fora de `src/config.ts`. A URL da agenda entra em `config.ts` e no `.env.example`.
- `QualificationFlow`: os cinco passos avançam na ordem; e-mail e telefone inválidos bloqueiam o avanço; a conclusão emite o objeto completo.
- `FiveFronts`: a frente 1 chega marcada com nota alta e vazia com nota baixa ou sem site; a contagem de saída acompanha as marcações.
- `AIChatAgent`: a transição entre os três estágios; falha de webhook cai no handoff sem perder o que já foi coletado.
- `LandingPage`: seis dobras renderizam; todo CTA aponta para `CTA_CHAPTER`.

## 9. Suposições em aberto

Não bloqueiam a implementação, mas precisam de confirmação do Raul antes de o texto ir ao ar:

1. **Assinatura do consultor.** Assumido: *Raul Vieira · Consultor de Inteligência Artificial · Engenheiro de Produção — UFSCar*, conforme ele se descreveu no brainstorming. O código hoje diz "Raul Pedro · Engenheiro & estrategista de IA". A credencial da UFSCar não aparece em lugar nenhum da página e é o argumento mais forte disponível.
2. **Provedor da agenda.** Assumido Cal.com (embed sem sair da página, plano gratuito suficiente). `BookingEmbed` é escrito atrás de interface agnóstica justamente para que trocar por Google Appointment Schedule custe um arquivo.
3. **Casos.** `cases.ts` carrega dois PENDENTES registrados no próprio arquivo: autorização de uso do nome de cada cliente, e a linha de apuração de cada número. A dobra 4 promete retorno auditável; enquanto a linha de apuração não existir, os cartões seguem sem imprimi-la, e a promessa fica sustentada apenas pela faixa "Como medimos".

Registrado à parte, fora do escopo desta reestruturação: `src/constants/links.ts` tem `EMAIL` e `LINKEDIN_URL` como placeholders.

## 10. Fora de escopo

- Redesenho visual da onda 3D, paleta ou tipografia
- `src/pages/OndaPage.tsx`
- Novos casos ou novos depoimentos
- Internacionalização
