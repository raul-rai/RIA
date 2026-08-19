# Intenções Contextuais do Agente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer cada CTA que leva ao agente injetar uma mensagem escrita na voz do lead, preenchida com o estado real dele, com o agente respondendo na hora a partir de texto local.

**Architecture:** Toda a copy e toda a decisão nascem em módulos puros (`src/content/intents.ts`, `src/lib/intent-format.ts`, `src/lib/agent-intent.ts`) cobertos por vitest. Um contexto novo e pequeno (`AgentIntentContext`) transporta a intenção do botão — que vive nas dobras 0, 2, 3 e 4 — até o agente, que vive na dobra 5 e está sempre montado. O `AIChatAgent` apenas consome: monta o contexto, gera as duas falas, aplica as travas e empurra os balões.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Tailwind 4, motion/react, lucide-react, vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-19-intencoes-contextuais-do-agente-design.md`

## Global Constraints

- **Testes rodam em `environment: 'node'`** e só coletam `tests/**/*.test.ts` (`vitest.config.ts`). Não existe jsdom nem React Testing Library, e **este plano não adiciona nenhum dos dois**. Componentes `.tsx` não são testados por unidade — são verificados por `npm run lint` (tsc) e pelo preview no navegador. Toda regra testável mora num `.ts` puro.
- **`tests/config.test.ts` é um contrato ativo:** o telefone `5516997879837` só pode aparecer em `src/constants/links.ts`; nenhuma URL contendo `webhook`, `easypanel` ou `cal.com` pode aparecer fora de `src/config.ts`. Nenhum arquivo deste plano introduz URLs.
- **Comentários no código são em português sem acentuação** (`intencao`, `pagina`, `frente`), seguindo o padrão do repositório. Texto visível ao usuário é acentuado normalmente.
- **A copy visível é a do spec, verbatim.** Os textos das seções 4.1 a 4.6 do spec já foram aprovados pelo Raul. Não reescrever, não "melhorar".
- **Os seis `IntentId`, exatos:** `hero-cold`, `diagnostic-result`, `diagnostic-no-website`, `front-pick`, `fronts-agenda`, `credibility`.
- **`action: "intent"`** é o valor no payload do n8n para essas mensagens — nunca `"sendMessage"`.
- **Commits em português sem acentuação**, prefixo `feat:` / `fix:` / `docs:` / `refactor:`, seguindo `git log`.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/intent-format.ts` | **Criar.** Formatação de texto: lista com "e" final, frentes descobertas, leitura da faixa de nota. Puro. |
| `src/content/intents.ts` | **Criar.** As seis intenções, as saudações do agente e o mapa de `?ref`. Só dados e funções puras de texto. |
| `src/lib/agent-intent.ts` | **Criar.** As três travas que decidem se a injeção acontece. Puro. |
| `src/context/AgentIntentContext.tsx` | **Criar.** Transporte do botão até o agente: `pending`, `requestIntent`, `consume`. |
| `src/content/fronts.ts` | **Modificar.** Ganha o campo `probe`. |
| `src/lib/analytics.ts` | **Modificar.** Ganha o evento `agent_intent`. |
| `src/components/AIChatAgent.tsx` | **Modificar.** Consome `pending`, injeta os dois balões, posta `action: "intent"`. |
| `src/pages/LandingPage.tsx` | **Modificar.** Monta o `AgentIntentProvider`; `SceneHero` perde `onStopWastingMoney`. |
| `src/components/PotentialDiagnostic.tsx` | **Modificar.** Perde `onWantStrategy` e `onNoWebsite`; dois CTAs e as copies de ponte. |
| `src/components/FiveFronts.tsx` | **Modificar.** Perde `onWantStrategy`; card ganha CTA próprio. |
| `src/components/CredibilitySection.tsx` | **Modificar.** Perde `onWantStrategy`. |
| `tests/intent-format.test.ts` | **Criar.** |
| `tests/intents.test.ts` | **Criar.** |
| `tests/agent-intent.test.ts` | **Criar.** |
| `tests/fronts.test.ts` | **Modificar.** Exige `probe` nas cinco frentes. |
| `docs/n8n-contrato-agente.md` | **Criar.** O contrato do webhook, para o workflow do n8n. |

## Desvio consciente do spec

A seção 5.5 do spec propõe o CTA do card com `stopPropagation` dentro do card. **Isso não é implementável como escrito:** o card hoje é um `<motion.button>` (`FiveFronts.tsx:64`), e HTML não permite `<button>` dentro de `<button>` — o React renderiza, o navegador desmonta a árvore e o clique fica imprevisível.

A Task 9 implementa o mesmo resultado sem o defeito: o card vira um `<div>` que carrega o visual, com o toggle e o CTA como **irmãos** dentro dele. Não é preciso `stopPropagation`, porque nunca há aninhamento. O gesto que o Raul aprovou — card = "já cubro", link no rodapé = "quero falar sobre" — fica idêntico na tela.

---

### Task 1: O campo `probe` nas cinco frentes

**Files:**
- Modify: `src/content/fronts.ts`
- Test: `tests/fronts.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `Front.probe: string` — a pergunta que o agente faz quando o lead escolhe a frente. Entra no meio de uma frase: começa em minúscula e não termina com pontuação. Consumido pela Task 3.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final do bloco `describe('FRONTS: o catalogo real da RIA', ...)` em `tests/fronts.test.ts`, logo depois do teste `FRONT-03`:

```ts
  it('FRONT-10: toda frente tem sondagem, formatada para entrar no meio de uma frase', () => {
    for (const f of FRONTS) {
      const probe = f.probe.trim();
      expect(probe.length).toBeGreaterThan(0);
      // Entra depois de "o que sua empresa faz, e ...?" — maiuscula ou ponto
      // final quebrariam a frase do agente.
      expect(probe).not.toMatch(/[.?!]$/);
      expect(probe[0]).toBe(probe[0].toLowerCase());
    }
  });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/fronts.test.ts`
Expected: FAIL — TypeScript/vitest acusa `Property 'probe' does not exist on type 'Front'`.

- [ ] **Step 3: Adicionar o campo à interface e às cinco frentes**

Em `src/content/fronts.ts`, adicionar o campo à interface `Front`, depois de `tag`:

```ts
  /** Etiqueta curta usada quando um caso aponta para esta frente. */
  tag: string;
  /**
   * A pergunta que o agente faz quando o lead escolhe esta frente no cartao.
   * Entra no meio de uma frase ("o que sua empresa faz, e {probe}?"), entao
   * comeca em minuscula e nao leva pontuacao final.
   */
  probe: string;
```

E acrescentar `probe` a cada uma das cinco entradas de `FRONTS`:

```ts
  {
    id: 1,
    label: 'Presença digital pronta para IA',
    promise: 'Site que o ChatGPT, o Gemini e o Perplexity conseguem citar quando alguém procura o que você vende.',
    tag: 'Presença digital',
    probe: 'quando alguém procura o que você vende no ChatGPT, o que aparece hoje',
  },
  {
    id: 2,
    label: 'Agente SDR 24/7',
    promise: 'Responde, qualifica e agenda sozinho — inclusive às duas da manhã de domingo.',
    tag: 'Agente SDR',
    probe: 'quantos contatos chegam por semana, e em quanto tempo alguém responde',
  },
  {
    id: 3,
    label: 'Automação de processos',
    promise: 'As rotinas repetitivas saem da mão da equipe e passam a rodar sem ninguém olhando.',
    tag: 'Automação',
    probe: 'qual rotina consome mais horas da equipe hoje',
  },
  {
    id: 4,
    label: 'Sistema sob medida',
    promise: 'O software que a sua operação precisa e que não existe pronto para comprar.',
    tag: 'Sistema sob medida',
    probe: 'qual controle da operação ainda vive numa planilha',
  },
  {
    id: 5,
    label: 'Dados e decisão',
    promise: 'Números que dizem o que fazer na segunda-feira, não o que aconteceu no mês passado.',
    tag: 'Dados e decisão',
    probe: 'qual número você olha antes de decidir a semana',
  },
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/fronts.test.ts`
Expected: PASS — 10 testes, incluindo `FRONT-10`.

- [ ] **Step 5: Commit**

```bash
git add src/content/fronts.ts tests/fronts.test.ts
git commit -m "feat: cada frente carrega a pergunta que o agente faz"
```

---

### Task 2: Formatação de texto das intenções

**Files:**
- Create: `src/lib/intent-format.ts`
- Test: `tests/intent-format.test.ts`

**Interfaces:**
- Consumes: `Front` de `src/content/fronts.ts` (Task 1).
- Produces:
  - `formatList(items: string[]): string` — `["A","B","C"]` → `"A, B e C"`.
  - `uncoveredFronts(fronts: Front[], checked: boolean[]): Front[]` — as frentes ainda descobertas, na ordem do catálogo.
  - `scoreBand(score: number): string` — leitura da nota em uma linha, sem pontuação final.

  Todas consumidas pela Task 3.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/intent-format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatList, uncoveredFronts, scoreBand } from '../src/lib/intent-format';
import { FRONTS } from '../src/content/fronts';

describe('formatList: lista que cabe dentro de uma frase', () => {
  it('FMT-01: lista vazia vira string vazia', () => {
    expect(formatList([])).toBe('');
  });

  it('FMT-02: um item sai sozinho, sem conectivo', () => {
    expect(formatList(['Automação'])).toBe('Automação');
  });

  it('FMT-03: dois itens sao ligados por "e", sem virgula', () => {
    expect(formatList(['Automação', 'Dados'])).toBe('Automação e Dados');
  });

  it('FMT-04: tres ou mais usam virgula ate o ultimo, que entra com "e"', () => {
    expect(formatList(['A', 'B', 'C'])).toBe('A, B e C');
    expect(formatList(['A', 'B', 'C', 'D'])).toBe('A, B, C e D');
  });
});

describe('uncoveredFronts: a pauta da sessao', () => {
  it('FMT-05: sem nada marcado, sobram as cinco na ordem do catalogo', () => {
    const result = uncoveredFronts(FRONTS, [false, false, false, false, false]);
    expect(result.map((f) => f.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('FMT-06: com tudo marcado, nao sobra nenhuma', () => {
    expect(uncoveredFronts(FRONTS, [true, true, true, true, true])).toEqual([]);
  });

  it('FMT-07: devolve exatamente as nao marcadas, preservando a ordem', () => {
    const result = uncoveredFronts(FRONTS, [true, false, true, false, false]);
    expect(result.map((f) => f.id)).toEqual([2, 4, 5]);
  });
});

describe('scoreBand: a leitura da nota do site', () => {
  it('FMT-08: os cortes sao 50 e 80, os mesmos da UI do diagnostico', () => {
    expect(scoreBand(49)).toBe(scoreBand(0));
    expect(scoreBand(50)).toBe(scoreBand(79));
    expect(scoreBand(80)).toBe(scoreBand(100));
    expect(scoreBand(49)).not.toBe(scoreBand(50));
    expect(scoreBand(79)).not.toBe(scoreBand(80));
  });

  it('FMT-09: nenhuma faixa termina com pontuacao — quem fecha a frase e o chamador', () => {
    for (const score of [0, 49, 50, 79, 80, 100]) {
      expect(scoreBand(score).trim()).not.toMatch(/[.?!]$/);
      expect(scoreBand(score).trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/intent-format.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/intent-format"`.

- [ ] **Step 3: Escrever a implementação mínima**

Criar `src/lib/intent-format.ts`:

```ts
import type { Front } from '../content/fronts';

/**
 * Lista legivel dentro de uma frase: "A, B e C".
 *
 * Existe porque join(', ') produz "A, B, C" — que ninguem fala. A mensagem
 * injetada no chat se apresenta como fala do lead; se ela nao soar como fala,
 * a ilusao inteira cai.
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** As frentes ainda descobertas, na ordem do catalogo. */
export function uncoveredFronts(fronts: Front[], checked: boolean[]): Front[] {
  return fronts.filter((_, i) => !checked[i]);
}

/**
 * Leitura da nota do site em uma linha, sem ponto final.
 *
 * Os cortes (50 e 80) sao os mesmos que PotentialDiagnostic.tsx usa para
 * colorir a nota no resultado. Se um mudar, o outro muda junto — o lead nao
 * pode ver vermelho na tela e ler "sustenta" no chat.
 */
export function scoreBand(score: number): string {
  if (score < 50) return 'Essa nota quer dizer que o site trava antes de convencer alguém';
  if (score < 80) return 'Essa nota quer dizer que o site funciona, mas não compete';
  return 'Essa nota é boa — o site sustenta, e o gargalo está em outra frente';
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/intent-format.test.ts`
Expected: PASS — 9 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/intent-format.ts tests/intent-format.test.ts
git commit -m "feat: formatacao de texto das intencoes do agente"
```

---

### Task 3: O catálogo das seis intenções

**Files:**
- Create: `src/content/intents.ts`
- Test: `tests/intents.test.ts`

**Interfaces:**
- Consumes: `FRONTS`, `Front` (Task 1); `formatList`, `uncoveredFronts`, `scoreBand` (Task 2).
- Produces:
  - `type IntentId = 'hero-cold' | 'diagnostic-result' | 'diagnostic-no-website' | 'front-pick' | 'fronts-agenda' | 'credibility'`
  - `interface IntentContext { ref: string | null; websiteScore: number | null; hasNoWebsite: boolean; frontsChecked: boolean[]; front?: Front }`
  - `interface IntentDefinition { id: IntentId; userMessage: (ctx: IntentContext) => string; agentReply: (ctx: IntentContext) => string }`
  - `const INTENTS: Record<IntentId, IntentDefinition>`
  - `const REF_LABEL: Record<string, string>` — consumido pelo `SceneHero` na Task 7.
  - `function readCampaignRef(search: string): string | null`
  - `const GREETING: string` e `const NO_WEBSITE_GREETING: string` — movidos do `AIChatAgent`, consumidos na Task 6.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/intents.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { INTENTS, readCampaignRef, REF_LABEL, GREETING, NO_WEBSITE_GREETING } from '../src/content/intents';
import type { IntentContext, IntentId } from '../src/content/intents';
import { FRONTS } from '../src/content/fronts';

const IDS: IntentId[] = [
  'hero-cold',
  'diagnostic-result',
  'diagnostic-no-website',
  'front-pick',
  'fronts-agenda',
  'credibility',
];

const base: IntentContext = {
  ref: null,
  websiteScore: null,
  hasNoWebsite: false,
  frontsChecked: [false, false, false, false, false],
};

/** Todos os estados de borda que o site consegue produzir. */
const CONTEXTS: IntentContext[] = [
  base,
  { ...base, ref: 'industria' },
  { ...base, ref: 'servicos' },
  { ...base, ref: 'varejo' },
  { ...base, websiteScore: 0 },
  { ...base, websiteScore: 49 },
  { ...base, websiteScore: 63 },
  { ...base, websiteScore: 100 },
  { ...base, hasNoWebsite: true },
  { ...base, frontsChecked: [true, false, false, false, false] },
  { ...base, frontsChecked: [true, true, true, true, false] },
  { ...base, frontsChecked: [true, true, true, true, true] },
  ...FRONTS.map((front) => ({ ...base, front })),
];

describe('INTENTS: as seis intencoes cobrem todos os estados', () => {
  it('INT-01: existem exatamente as seis intencoes do spec', () => {
    expect(Object.keys(INTENTS).sort()).toEqual([...IDS].sort());
  });

  it('INT-02: toda intencao declara o proprio id', () => {
    for (const id of IDS) expect(INTENTS[id].id).toBe(id);
  });

  it('INT-03: nenhum template vaza undefined, null, NaN ou chave nao substituida', () => {
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        for (const texto of [INTENTS[id].userMessage(ctx), INTENTS[id].agentReply(ctx)]) {
          expect(texto).not.toMatch(/undefined|null|NaN|\{|\}/);
          expect(texto.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('INT-04: nenhum texto tem espaco duplo ou espaco antes de pontuacao', () => {
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        for (const texto of [INTENTS[id].userMessage(ctx), INTENTS[id].agentReply(ctx)]) {
          expect(texto).not.toMatch(/ {2}/);
          expect(texto).not.toMatch(/ [.,?!]/);
        }
      }
    }
  });
});

describe('hero-cold: o lead frio, com ou sem campanha', () => {
  it('INT-05: sem ref, a frase nao menciona segmento', () => {
    expect(INTENTS['hero-cold'].userMessage(base)).toBe(
      'Quero parar de rasgar dinheiro. Por onde eu começo?'
    );
  });

  it('INT-06: com ref, o segmento abre a frase', () => {
    expect(INTENTS['hero-cold'].userMessage({ ...base, ref: 'industria' })).toBe(
      'Tenho uma indústria e quero parar de rasgar dinheiro. Por onde eu começo?'
    );
  });
});

describe('diagnostic-result: a nota entra na fala', () => {
  it('INT-07: com nota, o numero aparece na fala do lead', () => {
    expect(INTENTS['diagnostic-result'].userMessage({ ...base, websiteScore: 63 })).toBe(
      'Meu site tirou 63/100 no diagnóstico. Quero entender o que isso me custa.'
    );
  });

  it('INT-08: sem nota, degrada para a variante sem numero', () => {
    const texto = INTENTS['diagnostic-result'].userMessage(base);
    expect(texto).not.toMatch(/\d/);
    expect(texto).toContain('diagnóstico');
  });

  it('INT-09: a resposta muda de faixa junto com a nota', () => {
    const r = (score: number) => INTENTS['diagnostic-result'].agentReply({ ...base, websiteScore: score });
    expect(r(30)).not.toBe(r(63));
    expect(r(63)).not.toBe(r(90));
  });
});

describe('front-pick: uma frente escolhida no cartao', () => {
  it('INT-10: cada frente injeta o proprio numero, label e sondagem', () => {
    for (const front of FRONTS) {
      const ctx = { ...base, front };
      expect(INTENTS['front-pick'].userMessage(ctx)).toBe(
        `Quero falar sobre a frente ${front.id}: ${front.label}.`
      );
      const resposta = INTENTS['front-pick'].agentReply(ctx);
      expect(resposta).toContain(front.promise);
      expect(resposta).toContain(front.probe);
    }
  });
});

describe('fronts-agenda: a pauta muda com o que foi marcado', () => {
  it('INT-11: zero marcadas tem frase propria, sem contagem', () => {
    expect(INTENTS['fronts-agenda'].userMessage(base)).toBe(
      'Não cubro nenhuma das cinco frentes. Quero montar minha pauta.'
    );
  });

  it('INT-12: parcial lista as faltantes com "e" antes da ultima', () => {
    const texto = INTENTS['fronts-agenda'].userMessage({
      ...base,
      frontsChecked: [true, false, false, false, false],
    });
    expect(texto).toBe(
      'Marquei 1 de 5. Faltam Agente SDR, Automação, Sistema sob medida e Dados e decisão. Quero montar minha pauta.'
    );
  });

  it('INT-13: cinco marcadas viram conversa de otimizacao, nao de pauta', () => {
    const ctx = { ...base, frontsChecked: [true, true, true, true, true] };
    expect(INTENTS['fronts-agenda'].userMessage(ctx)).toBe(
      'Marquei as cinco frentes. Quero saber o que ainda dá pra melhorar.'
    );
    expect(INTENTS['fronts-agenda'].agentReply(ctx)).not.toContain('Pauta anotada');
  });

  it('INT-14: a resposta abre pela primeira frente descoberta', () => {
    const resposta = INTENTS['fronts-agenda'].agentReply({
      ...base,
      frontsChecked: [true, false, false, false, false],
    });
    expect(resposta).toContain(FRONTS[1].label);
  });
});

describe('diagnostic-no-website: quem nao tem onde ser encontrado', () => {
  it('INT-15: a resposta reusa a saudacao de quem nao tem site', () => {
    expect(INTENTS['diagnostic-no-website'].agentReply(base)).toBe(NO_WEBSITE_GREETING);
  });
});

describe('readCampaignRef: o ?ref da campanha', () => {
  it('INT-16: le e normaliza para minuscula', () => {
    expect(readCampaignRef('?ref=INDUSTRIA')).toBe('industria');
  });

  it('INT-17: ref ausente ou desconhecido vira null', () => {
    expect(readCampaignRef('')).toBeNull();
    expect(readCampaignRef('?ref=agropecuaria')).toBeNull();
    expect(readCampaignRef('?utm_source=x')).toBeNull();
  });

  it('INT-18: todo ref aceito tem etiqueta legivel', () => {
    for (const key of Object.keys(REF_LABEL)) {
      expect(readCampaignRef(`?ref=${key}`)).toBe(key);
      expect(REF_LABEL[key].trim().length).toBeGreaterThan(0);
    }
  });
});

describe('As saudacoes saem do componente e passam a morar aqui', () => {
  it('INT-19: as duas existem e sao diferentes', () => {
    expect(GREETING.trim().length).toBeGreaterThan(0);
    expect(NO_WEBSITE_GREETING.trim().length).toBeGreaterThan(0);
    expect(GREETING).not.toBe(NO_WEBSITE_GREETING);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/intents.test.ts`
Expected: FAIL — `Failed to resolve import "../src/content/intents"`.

- [ ] **Step 3: Escrever a implementação**

Criar `src/content/intents.ts`:

```ts
import type { Front } from './fronts';
import { FRONTS } from './fronts';
import { formatList, scoreBand, uncoveredFronts } from '../lib/intent-format';

/**
 * As intencoes contextuais do agente.
 *
 * Cada CTA que leva ao chat carrega uma intencao. Ela vira duas falas: o que o
 * lead "diz" ao chegar e o que o agente responde na hora. As duas sao locais —
 * o n8n recebe as duas para memoria, mas nao responde a primeira. Ver
 * docs/superpowers/specs/2026-08-19-intencoes-contextuais-do-agente-design.md.
 */

export type IntentId =
  | 'hero-cold'
  | 'diagnostic-result'
  | 'diagnostic-no-website'
  | 'front-pick'
  | 'fronts-agenda'
  | 'credibility';

/** Segmentos aceitos em ?ref=. Fonte unica: o hero le daqui para a etiqueta,
 *  a intencao le daqui para a mensagem. */
export const REF_LABEL: Record<string, string> = {
  industria: 'Indústria',
  servicos: 'Serviços',
  varejo: 'Varejo',
};

/** Como o segmento abre a fala do lead. Nao da para derivar de REF_LABEL:
 *  "Tenho uma Serviços" nao e portugues. */
const REF_PHRASE: Record<string, string> = {
  industria: 'Tenho uma indústria',
  servicos: 'Tenho uma empresa de serviços',
  varejo: 'Tenho um varejo',
};

/** Le o ?ref da campanha. Valor desconhecido vira null — a intencao degrada
 *  para a variante sem segmento em vez de montar uma frase quebrada. */
export function readCampaignRef(search: string): string | null {
  const ref = new URLSearchParams(search).get('ref')?.toLowerCase();
  return ref && ref in REF_LABEL ? ref : null;
}

export const GREETING =
  'Olá. Sou o Agente de Inteligência da RIA. Me conte em uma frase o que sua empresa faz e onde o tempo da equipe está indo — eu volto com onde a IA paga mais rápido.';

export const NO_WEBSITE_GREETING =
  'Você ainda nem tem um site para surfar a era da inteligência artificial. Por isso seu índice bateu 101%: não existe página para o ChatGPT, o Gemini ou o Perplexity citarem quando alguém procura o que você vende. Me diga em uma frase o que sua empresa faz — eu volto com o que precisa estar no ar primeiro.';

export interface IntentContext {
  /** Segmento da campanha, ja validado por readCampaignRef. */
  ref: string | null;
  websiteScore: number | null;
  hasNoWebsite: boolean;
  frontsChecked: boolean[];
  /** Presente so em front-pick. */
  front?: Front;
}

export interface IntentDefinition {
  id: IntentId;
  /** O que o lead "diz" ao chegar no chat. */
  userMessage: (ctx: IntentContext) => string;
  /** O que o agente responde, instantaneo, sem passar pelo n8n. */
  agentReply: (ctx: IntentContext) => string;
}

/** front-pick sem frente e um estado impossivel pela UI, mas o tipo permite.
 *  Cair na frente 1 e melhor do que renderizar "undefined" no chat do lead. */
function pickedFront(ctx: IntentContext): Front {
  return ctx.front ?? FRONTS[0];
}

export const INTENTS: Record<IntentId, IntentDefinition> = {
  'hero-cold': {
    id: 'hero-cold',
    userMessage: (ctx) => {
      const abertura = ctx.ref ? REF_PHRASE[ctx.ref] : undefined;
      return abertura
        ? `${abertura} e quero parar de rasgar dinheiro. Por onde eu começo?`
        : 'Quero parar de rasgar dinheiro. Por onde eu começo?';
    },
    agentReply: () =>
      'Começa por saber onde está o vazamento. Me diz em uma frase o que sua empresa faz e onde o tempo da equipe está indo — eu volto com a frente que paga mais rápido.',
  },

  'diagnostic-result': {
    id: 'diagnostic-result',
    userMessage: (ctx) =>
      ctx.websiteScore === null
        ? 'Fiz o diagnóstico do meu site e quero entender o que ele me custa.'
        : `Meu site tirou ${ctx.websiteScore}/100 no diagnóstico. Quero entender o que isso me custa.`,
    agentReply: (ctx) =>
      ctx.websiteScore === null
        ? 'Sem a nota eu não chuto o tamanho do buraco. Me diz o que sua empresa vende e pra quem — e, se puder, roda a auditoria do site aqui em cima que eu leio o resultado com você.'
        : `${scoreBand(ctx.websiteScore)}. A nota é sintoma — o custo está nas buscas e nas citações de IA que passam longe de você. Me diz o que sua empresa vende e pra quem.`,
  },

  'diagnostic-no-website': {
    id: 'diagnostic-no-website',
    userMessage: () =>
      'Ainda não tenho site. Quero saber o que preciso pra existir na era da IA.',
    agentReply: () => NO_WEBSITE_GREETING,
  },

  'front-pick': {
    id: 'front-pick',
    userMessage: (ctx) => {
      const front = pickedFront(ctx);
      return `Quero falar sobre a frente ${front.id}: ${front.label}.`;
    },
    agentReply: (ctx) => {
      const front = pickedFront(ctx);
      return `${front.promise} Pra dimensionar isso na sua operação: o que sua empresa faz, e ${front.probe}?`;
    },
  },

  'fronts-agenda': {
    id: 'fronts-agenda',
    userMessage: (ctx) => {
      const faltando = uncoveredFronts(FRONTS, ctx.frontsChecked);
      const marcadas = FRONTS.length - faltando.length;
      if (marcadas === 0) return 'Não cubro nenhuma das cinco frentes. Quero montar minha pauta.';
      if (faltando.length === 0)
        return 'Marquei as cinco frentes. Quero saber o que ainda dá pra melhorar.';
      return `Marquei ${marcadas} de 5. Faltam ${formatList(
        faltando.map((f) => f.tag)
      )}. Quero montar minha pauta.`;
    },
    agentReply: (ctx) => {
      const faltando = uncoveredFronts(FRONTS, ctx.frontsChecked);
      if (faltando.length === 0)
        return 'Cinco de cinco é raro. Então a conversa deixa de ser sobre o que falta e passa a ser sobre o que está rodando abaixo do que poderia. Me diz o que sua empresa faz e qual dessas cinco te dá mais trabalho hoje.';
      const primeira = faltando[0];
      const fecho =
        faltando.length === 1
          ? 'Me diz o que sua empresa faz que eu dimensiono essa e já abro a agenda.'
          : `Me diz o que sua empresa faz que eu ordeno as ${faltando.length} por retorno e já abro a agenda.`;
      return `Pauta anotada. Começo pela ${primeira.label} — ${primeira.promise} ${fecho}`;
    },
  },

  credibility: {
    id: 'credibility',
    userMessage: () => 'Vi os casos. Quero saber o que dá pra fazer na minha empresa.',
    agentReply: () =>
      'Operações diferentes, método igual. Me conta o que sua empresa faz e onde dói mais — eu volto com qual dos casos se parece com o seu.',
  },
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/intents.test.ts`
Expected: PASS — 19 testes.

- [ ] **Step 5: Commit**

```bash
git add src/content/intents.ts tests/intents.test.ts
git commit -m "feat: catalogo das seis intencoes contextuais do agente"
```

---

### Task 4: As travas da injeção

**Files:**
- Create: `src/lib/agent-intent.ts`
- Test: `tests/agent-intent.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type AgentStage = 'chat' | 'qualifying' | 'booking'`
  - `interface GuardMessage { role: 'user' | 'assistant'; content: string }`
  - `interface InjectionGuardInput { stage: AgentStage; isTyping: boolean; messages: GuardMessage[]; candidateUserMessage: string }`
  - `function shouldInject(input: InjectionGuardInput): boolean`

  Consumido pela Task 6.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/agent-intent.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shouldInject } from '../src/lib/agent-intent';
import type { InjectionGuardInput } from '../src/lib/agent-intent';

const base: InjectionGuardInput = {
  stage: 'chat',
  isTyping: false,
  messages: [{ role: 'assistant', content: 'Olá.' }],
  candidateUserMessage: 'Quero montar minha pauta.',
};

describe('shouldInject: quando a mensagem do botao entra na conversa', () => {
  it('GUARD-01: conversa parada em chat aceita a injecao', () => {
    expect(shouldInject(base)).toBe(true);
  });

  it('GUARD-02: qualificacao em andamento bloqueia — o lead esta digitando telefone', () => {
    expect(shouldInject({ ...base, stage: 'qualifying' })).toBe(false);
  });

  it('GUARD-03: agenda aberta bloqueia — a conversao ja estava ganha', () => {
    expect(shouldInject({ ...base, stage: 'booking' })).toBe(false);
  });

  it('GUARD-04: agente respondendo bloqueia — duas falas do bot sairiam fora de ordem', () => {
    expect(shouldInject({ ...base, isTyping: true })).toBe(false);
  });

  it('GUARD-05: mesma fala do lead na sequencia bloqueia — clique duplo nao duplica', () => {
    expect(
      shouldInject({
        ...base,
        messages: [
          { role: 'assistant', content: 'Olá.' },
          { role: 'user', content: 'Quero montar minha pauta.' },
          { role: 'assistant', content: 'Pauta anotada.' },
        ],
      })
    ).toBe(false);
  });

  it('GUARD-06: fala igual mais antiga nao bloqueia — so a ultima do lead conta', () => {
    expect(
      shouldInject({
        ...base,
        messages: [
          { role: 'user', content: 'Quero montar minha pauta.' },
          { role: 'assistant', content: 'Pauta anotada.' },
          { role: 'user', content: 'Somos uma metalúrgica.' },
          { role: 'assistant', content: 'Entendi.' },
        ],
      })
    ).toBe(true);
  });

  it('GUARD-07: intencao diferente sempre passa — e o lead voltando com dado novo', () => {
    expect(
      shouldInject({
        ...base,
        messages: [
          { role: 'user', content: 'Quero parar de rasgar dinheiro. Por onde eu começo?' },
          { role: 'assistant', content: 'Começa por saber onde está o vazamento.' },
        ],
      })
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run tests/agent-intent.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/agent-intent"`.

- [ ] **Step 3: Escrever a implementação**

Criar `src/lib/agent-intent.ts`:

```ts
/**
 * A decisao de injetar a mensagem de um botao na conversa.
 *
 * Fica fora do componente porque cada trava evita uma falha concreta que
 * precisa de teste proprio — e nenhuma delas depende de React.
 */

export type AgentStage = 'chat' | 'qualifying' | 'booking';

export interface GuardMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InjectionGuardInput {
  stage: AgentStage;
  isTyping: boolean;
  messages: GuardMessage[];
  candidateUserMessage: string;
}

/**
 * Em todos os casos bloqueados o visitante ainda e levado ao agente pela
 * rolagem — ele pediu para ir e vai. So a injecao e suprimida.
 */
export function shouldInject(input: InjectionGuardInput): boolean {
  // Qualificacao ou agenda na tela: um balao novo caindo aqui derruba a
  // conversao que ja estava ganha.
  if (input.stage !== 'chat') return false;

  // Agente no meio de uma resposta: injetar produz duas falas do bot fora de
  // ordem.
  if (input.isTyping) return false;

  // Clique duplo no mesmo botao nao vira mensagem duplicada. So a ultima fala
  // do lead conta: repetir a mesma intencao depois de uma conversa inteira e
  // legitimo.
  const ultimaDoLead = [...input.messages].reverse().find((m) => m.role === 'user');
  if (ultimaDoLead?.content === input.candidateUserMessage) return false;

  return true;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run tests/agent-intent.test.ts`
Expected: PASS — 7 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agent-intent.ts tests/agent-intent.test.ts
git commit -m "feat: travas que decidem se a intencao entra na conversa"
```

---

### Task 5: O transporte — `AgentIntentContext`

**Files:**
- Create: `src/context/AgentIntentContext.tsx`
- Modify: `src/lib/analytics.ts`

**Interfaces:**
- Consumes: `IntentId` (Task 3); `FrontId` de `src/content/fronts.ts`; `track` de `src/lib/analytics.ts`; `useVulnerability` de `src/context/VulnerabilityContext.tsx`.
- Produces:
  - `interface AgentIntentRequest { id: IntentId; frontId?: FrontId; nonce: number }`
  - `interface AgentIntentState { pending: AgentIntentRequest | null; requestIntent: (id: IntentId, frontId?: FrontId) => void; consume: () => void }`
  - `function AgentIntentProvider(props: { onReachAgent: () => void; children: React.ReactNode }): JSX.Element`
  - `function useAgentIntent(): AgentIntentState`

  Consumidos pelas Tasks 6, 7, 8 e 9.

- [ ] **Step 1: Registrar o evento novo de analytics**

Em `src/lib/analytics.ts`, adicionar ao union `RiaEvent`, logo depois de `'cta_click'`:

```ts
  | 'cta_click'
  /** Um CTA levou o lead ao agente carregando intencao. Ver content/intents.ts. */
  | 'agent_intent'
```

- [ ] **Step 2: Criar o contexto**

Criar `src/context/AgentIntentContext.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { IntentId } from '../content/intents';
import type { FrontId } from '../content/fronts';
import { useVulnerability } from './VulnerabilityContext';
import { track } from '../lib/analytics';

/**
 * O canal entre o botao e o agente.
 *
 * Os CTAs vivem nas dobras 0, 2, 3 e 4; o agente vive na dobra 5 e esta sempre
 * montado. Este contexto carrega a intencao do clique de um lado ao outro.
 *
 * Nao mora no VulnerabilityContext de proposito: aquele responde "quao exposta
 * esta esta empresa", este responde "de onde veio este clique". Misturar faria
 * o provider do indice virar despachante de UI, e todo teste de vulnerabilidade
 * passaria a arrastar estado de chat.
 */

export interface AgentIntentRequest {
  id: IntentId;
  frontId?: FrontId;
  /**
   * Incrementa a cada pedido. Sem ele, pedir a mesma intencao duas vezes
   * produziria um objeto equivalente e o efeito do agente nao dispararia de
   * novo — a reentrada deixaria de funcionar justamente no caso que ela existe
   * para atender.
   */
  nonce: number;
}

export interface AgentIntentState {
  pending: AgentIntentRequest | null;
  requestIntent: (id: IntentId, frontId?: FrontId) => void;
  consume: () => void;
}

const AgentIntentContext = createContext<AgentIntentState | undefined>(undefined);

export function AgentIntentProvider({
  onReachAgent,
  children,
}: {
  /** Leva o visitante ate a dobra do agente. */
  onReachAgent: () => void;
  children: React.ReactNode;
}) {
  const { frontsChecked, websiteScore } = useVulnerability();
  const [pending, setPending] = useState<AgentIntentRequest | null>(null);
  const nonce = useRef(0);

  const requestIntent = useCallback(
    (id: IntentId, frontId?: FrontId) => {
      nonce.current += 1;
      track('agent_intent', {
        intent_id: id,
        front_id: frontId,
        fronts_covered: frontsChecked.filter(Boolean).length,
        website_score: websiteScore ?? undefined,
      });
      setPending({ id, frontId, nonce: nonce.current });
      onReachAgent();
    },
    [frontsChecked, websiteScore, onReachAgent]
  );

  const consume = useCallback(() => setPending(null), []);

  const value = useMemo<AgentIntentState>(
    () => ({ pending, requestIntent, consume }),
    [pending, requestIntent, consume]
  );

  return <AgentIntentContext.Provider value={value}>{children}</AgentIntentContext.Provider>;
}

export function useAgentIntent(): AgentIntentState {
  const context = useContext(AgentIntentContext);
  if (!context) {
    throw new Error('useAgentIntent must be used within an AgentIntentProvider');
  }
  return context;
}
```

- [ ] **Step 3: Verificar que compila**

Run: `npm run lint`
Expected: sem erros. `AgentIntentProvider` ainda não é usado — TypeScript não reclama de export não consumido.

- [ ] **Step 4: Commit**

```bash
git add src/context/AgentIntentContext.tsx src/lib/analytics.ts
git commit -m "feat: contexto que leva a intencao do botao ate o agente"
```

---

### Task 6: O agente consome a intenção

**Files:**
- Modify: `src/components/AIChatAgent.tsx`

**Interfaces:**
- Consumes: `INTENTS`, `IntentContext`, `IntentId`, `readCampaignRef`, `GREETING`, `NO_WEBSITE_GREETING` (Task 3); `shouldInject` (Task 4); `useAgentIntent` (Task 5); `missingFronts` de `src/lib/fronts.ts`.
- Produces: nada consumido por outras tasks. Depois desta task o agente reage a `pending`, mas nenhum botão ainda o produz — Tasks 7 a 9 ligam os botões.

- [ ] **Step 1: Trocar as saudações locais pelo import**

Em `src/components/AIChatAgent.tsx`, **apagar** as duas constantes locais `GREETING` e `NO_WEBSITE_GREETING` (as declarações `const GREETING = '...'` e `const NO_WEBSITE_GREETING = '...'`, logo abaixo de `NO_WEBSITE_SUGGESTIONS`).

Adicionar aos imports do topo do arquivo:

```tsx
import {
  INTENTS,
  readCampaignRef,
  GREETING,
  NO_WEBSITE_GREETING,
  type IntentContext,
  type IntentId,
} from '../content/intents';
import { useAgentIntent } from '../context/AgentIntentContext';
import { shouldInject } from '../lib/agent-intent';
import { missingFronts } from '../lib/fronts';
```

`FRONTS` já está importado de `../content/fronts`.

- [ ] **Step 2: Verificar que ainda compila e a página não mudou**

Run: `npm run lint`
Expected: sem erros. Nesse ponto a única mudança é de onde as saudações vêm.

- [ ] **Step 3: Ler o `pending` no corpo do componente**

Em `AIChatAgent`, logo depois da linha `const { vulnerabilityIndex, assessed, hasNoWebsite, frontsChecked, websiteScore } = useVulnerability();`, adicionar:

```tsx
  const { pending, consume } = useAgentIntent();
```

- [ ] **Step 4: Adicionar o registro fire-and-forget ao n8n**

Adicionar, logo antes da declaração `const send = async (text: string) => {`:

```tsx
  /**
   * Registro da intencao no n8n. Nao e pergunta: a resposta ja esta na tela.
   * O workflow trata action: 'intent' gravando as duas falas na memoria da
   * sessao e devolvendo 200 sem gerar resposta do LLM — ver
   * docs/n8n-contrato-agente.md.
   */
  const postIntent = async (intentId: IntentId, chatInput: string, agentReply: string) => {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'intent',
          intentId,
          chatInput,
          agentReply,
          context: {
            vulnerabilityIndex: assessedVulnerabilityIndex,
            hasNoWebsite,
            websiteScore,
            frontsCovered: frontsChecked.filter(Boolean).length,
            frontsMissing: missingFronts(frontsChecked, FRONTS.map((f) => f.id)),
          },
        }),
      });
    } catch {
      // A conversa ja esta na tela e funcionando. Falhar o registro nao pode
      // custar nada ao lead — por isso a resposta de abertura e local.
    }
  };
```

- [ ] **Step 5: Adicionar o efeito que injeta**

Adicionar logo depois do bloco `postIntent`:

```tsx
  /**
   * Ja tratado: o efeito roda de novo quando `messages` muda, e sem esta trava
   * a mesma intencao seria injetada em loop.
   */
  const handledNonce = useRef(0);

  useEffect(() => {
    if (!pending || pending.nonce === handledNonce.current) return;
    handledNonce.current = pending.nonce;
    consume();

    const definition = INTENTS[pending.id];
    const ctx: IntentContext = {
      ref: readCampaignRef(typeof window === 'undefined' ? '' : window.location.search),
      websiteScore,
      hasNoWebsite,
      frontsChecked,
      front: pending.frontId ? FRONTS.find((f) => f.id === pending.frontId) : undefined,
    };

    const userMessage = definition.userMessage(ctx);
    if (!shouldInject({ stage, isTyping, messages, candidateUserMessage: userMessage })) return;

    const agentReply = definition.agentReply(ctx);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: agentReply },
    ]);
    void postIntent(pending.id, userMessage, agentReply);
    // postIntent le estado atual a cada chamada e nao precisa entrar nas deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, consume, stage, isTyping, messages, websiteScore, hasNoWebsite, frontsChecked]);
```

- [ ] **Step 6: Verificar que compila**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — todos os arquivos, incluindo `tests/config.test.ts` (nenhuma URL nova foi introduzida).

- [ ] **Step 8: Commit**

```bash
git add src/components/AIChatAgent.tsx
git commit -m "feat: agente injeta a fala do lead e responde local por intencao"
```

---

### Task 7: Ligar o Provider, o hero e a credibilidade

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/components/CredibilitySection.tsx`

**Interfaces:**
- Consumes: `AgentIntentProvider`, `useAgentIntent` (Task 5); `REF_LABEL` (Task 3).
- Produces: o `AgentIntentProvider` montado na árvore, com `onReachAgent = goToCta`. Tasks 8 e 9 dependem dele existir.

- [ ] **Step 1: `SceneHero` passa a pedir a intenção**

Em `src/pages/LandingPage.tsx`, adicionar aos imports:

```tsx
import { AgentIntentProvider, useAgentIntent } from '../context/AgentIntentContext';
import { REF_LABEL } from '../content/intents';
```

Na função `SceneHero`, trocar a assinatura e apagar o `REF_LABEL` local:

```tsx
function SceneHero({ onUnderstandMore }: { onUnderstandMore: () => void }) {
  const { requestIntent } = useAgentIntent();
  const searchParams = new URLSearchParams(window.location.search);
  const ref = searchParams.get('ref')?.toLowerCase();
```

Apagar o bloco:

```tsx
  const REF_LABEL: Record<string, string> = {
    industria: 'Indústria',
    servicos: 'Serviços',
    varejo: 'Varejo',
  };
```

E trocar o `onClick` do primeiro `MagneticButton`:

```tsx
        <MagneticButton
          onClick={() => {
            track('cta_click', { location: 'hero' });
            requestIntent('hero-cold');
          }}
          className="w-full sm:w-auto group px-7 py-4 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-accent shadow-2xl flex items-center justify-center gap-2.5 min-h-[52px]"
        >
```

- [ ] **Step 2: Montar o Provider e ajustar o `chapterContent`**

Ainda em `LandingPage.tsx`, dentro de `export default function LandingPage()`:

Apagar a linha `const goToFronts = useCallback(() => goToChapter(FRONTS_CHAPTER), [goToChapter]);` e a constante `const FRONTS_CHAPTER = 3;` do topo do arquivo — nenhum CTA aponta mais para o capítulo das frentes.

Trocar o `chapterContent` por:

```tsx
  const chapterContent = useMemo(() => [
    <SceneHero onUnderstandMore={goToMarketVoices} />,
    <SocialProofSection />,
    <PotentialDiagnostic />,
    <FiveFronts />,
    <CredibilitySection />,
    <SceneCTA />,
  ], [goToMarketVoices]);
```

E envolver a árvore com o Provider — trocar a abertura e o fechamento do `return`:

```tsx
  return (
    <VulnerabilityProvider>
      <AgentIntentProvider onReachAgent={goToCta}>
        <div className="bg-white text-slate-900 font-sans selection:bg-accent/20 selection:text-slate-900">
```

…mantendo todo o conteúdo interno inalterado, e fechando:

```tsx
          <WhatsAppFab hideOnChapter={CTA_CHAPTER} />
        </div>
      </AgentIntentProvider>
    </VulnerabilityProvider>
  );
```

- [ ] **Step 3: `CredibilitySection` perde o prop**

Em `src/components/CredibilitySection.tsx`, adicionar ao topo:

```tsx
import { useAgentIntent } from '../context/AgentIntentContext';
```

Trocar a assinatura:

```tsx
export default function CredibilitySection() {
  const { requestIntent } = useAgentIntent();
```

E o `onClick` do botão:

```tsx
                onClick={() => {
                  track('cta_click', { location: 'credibility' });
                  requestIntent('credibility');
                }}
```

- [ ] **Step 4: Verificar que compila**

Run: `npm run lint`
Expected: sem erros. Se o tsc reclamar de `FRONTS_CHAPTER` ou `goToFronts` não usados, é porque uma das remoções do Step 2 ficou pela metade.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx src/components/CredibilitySection.tsx
git commit -m "feat: hero e credibilidade levam intencao ao agente"
```

---

### Task 8: Os dois CTAs do diagnóstico

**Files:**
- Modify: `src/components/PotentialDiagnostic.tsx`

**Interfaces:**
- Consumes: `useAgentIntent` (Task 5), montado pela Task 7.
- Produces: nada consumido por outras tasks.

O destino dos dois CTAs muda de "as cinco frentes" para "o agente" (decisão 3.2 do spec). As copies que anunciam o destino mudam junto — prometer frentes e entregar chat é pior do que não prometer nada.

- [ ] **Step 1: Trocar os props pelo hook**

Em `src/components/PotentialDiagnostic.tsx`, adicionar ao topo:

```tsx
import { useAgentIntent } from '../context/AgentIntentContext';
```

Apagar a interface inteira:

```tsx
interface PotentialDiagnosticProps {
  onWantStrategy?: () => void;
  onNoWebsite?: () => void;
}
```

E trocar a assinatura do componente:

```tsx
export default function PotentialDiagnostic() {
  const { requestIntent } = useAgentIntent();
  const {
```

- [ ] **Step 2: A rolagem automática de "não tenho site" passa a carregar intenção**

Trocar a linha que agenda a rolagem (dentro do handler que chama `track('diagnostic_no_website')`):

```tsx
    scrollTimer.current = setTimeout(() => requestIntent('diagnostic-no-website'), NO_WEBSITE_SCROLL_DELAY_MS);
```

E o comentário do `NO_WEBSITE_SCROLL_DELAY_MS` continua válido — o respiro existe para o visitante ver o índice virar 101% antes de sair da dobra.

- [ ] **Step 3: Ajustar o bloco "não tenho site"**

Trocar o aviso de destino:

```tsx
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-red-500 mb-3">
              Levando você ao agente…
            </p>
```

E o botão:

```tsx
            <button
              onClick={() => {
                track('cta_click', { location: 'diagnostic_no_website' });
                requestIntent('diagnostic-no-website');
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all inline-flex items-center gap-2 shadow-md"
            >
              <span>Falar com o agente agora</span>
              <ArrowRight size={14} />
            </button>
```

- [ ] **Step 4: Ajustar o bloco do resultado**

Trocar a ponte narrativa:

```tsx
                    {/* Ponte narrativa: o site que acabou de ser avaliado e a
                        primeira das cinco frentes. O agente mostra as outras. */}
                    <p className="text-slate-700 text-[11px] md:text-xs leading-snug font-semibold mt-1.5">
                      O site é a primeira das cinco frentes. O agente te mostra as outras quatro.
                    </p>
```

E o botão:

```tsx
                <button
                  onClick={() => {
                    track('cta_click', { location: 'diagnostic_result' });
                    requestIntent('diagnostic-result');
                  }}
                  className="px-5 py-3 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 shadow-md shrink-0"
                >
                  <span>Falar com o agente</span>
                  <ArrowRight size={14} />
                </button>
```

- [ ] **Step 5: Verificar que compila**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/components/PotentialDiagnostic.tsx
git commit -m "feat: os dois ctas do diagnostico levam a tensao ate o agente"
```

---

### Task 9: As Cinco Frentes — CTA da pauta e CTA por card

**Files:**
- Modify: `src/components/FiveFronts.tsx`

**Interfaces:**
- Consumes: `useAgentIntent` (Task 5), montado pela Task 7.
- Produces: nada consumido por outras tasks.

O card hoje é um `<motion.button>`. Um `<button>` dentro de outro é HTML inválido, então o card vira um `<div>` que carrega o visual, com o toggle e o CTA como irmãos. Nenhum `stopPropagation` é necessário — ver "Desvio consciente do spec" no topo deste plano.

- [ ] **Step 1: Trocar o prop pelo hook**

Em `src/components/FiveFronts.tsx`, adicionar ao topo:

```tsx
import { useAgentIntent } from '../context/AgentIntentContext';
```

Trocar a assinatura:

```tsx
export default function FiveFronts() {
  const { requestIntent } = useAgentIntent();
  const { frontsChecked, toggleFront, hasNoWebsite, websiteScore } = useVulnerability();
```

- [ ] **Step 2: Reestruturar o card**

Substituir todo o bloco `{FRONTS.map((front, i) => { ... })}` por:

```tsx
        {FRONTS.map((front, i) => {
          const isChecked = frontsChecked[i];
          const destacada = i === 0 && primeiraVazia && !isChecked;
          const tom = isChecked
            ? 'bg-emerald-50/90 border-emerald-300'
            : destacada
              ? 'bg-red-50/90 border-red-300'
              : 'bg-white/90 border-slate-200 hover:border-slate-300';
          return (
            /* O cartao deixa de ser <button> porque passou a conter um: o
               toggle "ja cubro" e o atalho "falar sobre" sao irmaos, nunca
               aninhados — <button> dentro de <button> e HTML invalido. */
            <div key={front.id} className={`flex flex-col rounded-2xl border transition-colors ${tom}`}>
              <motion.button
                type="button"
                onClick={() => {
                  toggleFront(i);
                  track('front_toggle', { id: front.id, checked: !isChecked });
                }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={isChecked}
                className="text-left flex gap-3.5 p-4"
              >
                <span
                  className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                    isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                  }`}
                >
                  {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                    Frente {front.id}
                  </span>
                  <span
                    className={`block text-xs md:text-sm font-bold leading-snug mb-1 ${
                      isChecked ? 'text-emerald-950' : 'text-slate-900'
                    }`}
                  >
                    {front.label}
                  </span>
                  <span className="block text-[11px] md:text-xs text-slate-600 leading-snug">
                    {front.promise}
                  </span>
                  {destacada && (
                    <span className="block mt-2 text-[11px] font-bold text-red-800 leading-snug">
                      {hasNoWebsite
                        ? 'Você acabou de dizer que ainda não tem site. Esta é a primeira.'
                        : `Seu site tirou ${websiteScore}/100 no diagnóstico. Esta é a primeira.`}
                    </span>
                  )}
                </span>
              </motion.button>

              {/* So nos cartoes vazios: pedir uma frente que voce acabou de
                  declarar coberta nao e um estado que precise existir. */}
              {!isChecked && (
                <button
                  type="button"
                  onClick={() => {
                    track('cta_click', { location: 'front_card', front_id: front.id });
                    requestIntent('front-pick', front.id);
                  }}
                  className="self-start mx-4 mb-3 py-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-accent hover:text-accent-dark underline underline-offset-2"
                >
                  Falar sobre esta frente <ArrowRight size={12} />
                </button>
              )}
            </div>
          );
        })}
```

- [ ] **Step 3: Ligar o CTA principal**

Trocar o botão "Montar minha pauta":

```tsx
        <button
          onClick={() => {
            track('cta_click', { location: 'five_fronts' });
            requestIntent('fronts-agenda');
          }}
          className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg"
        >
          Montar minha pauta <ArrowRight size={14} />
        </button>
```

- [ ] **Step 4: Verificar que compila e a suíte passa**

Run: `npm run lint && npm test`
Expected: lint sem erros; testes todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/FiveFronts.tsx
git commit -m "feat: cada frente descoberta abre a conversa no proprio assunto"
```

---

### Task 10: Contrato do n8n, documentação e verificação no navegador

**Files:**
- Create: `docs/n8n-contrato-agente.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: tudo das Tasks 1 a 9.
- Produces: o documento que o Raul leva para ajustar o workflow do n8n.

- [ ] **Step 1: Escrever o contrato do webhook**

Criar `docs/n8n-contrato-agente.md`:

````markdown
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

## 3. `action: "qualification"` — os cinco campos

Inalterado. Ver `src/lib/qualification.ts`.

## Falhas

Falha em `sendMessage` vira desvio visível para o WhatsApp. Falha em `intent`
é silenciosa por decisão de projeto: a conversa já está na tela e funcionando,
e o registro não pode custar a conversa ao lead.
````

- [ ] **Step 2: Documentar o evento novo em `.env.example`**

Em `.env.example`, na lista de eventos instrumentados do bloco `VITE_GA_MEASUREMENT_ID`, trocar a linha final:

```
# Eventos ja instrumentados: chapter_view, cta_click, agent_intent,
# operational_check, diagnostic_started/completed/failed,
# agent_message_sent/replied/failed, whatsapp_click.
```

- [ ] **Step 3: Rodar lint e a suíte inteira**

Run: `npm run lint && npm test`
Expected: lint sem erros; todos os testes PASS, incluindo `intent-format`, `intents`, `agent-intent` e `fronts`.

- [ ] **Step 4: Verificar no navegador**

Subir o preview e percorrer os quatro caminhos. Para cada um, confirmar que a página rola até o agente **e** que os dois balões aparecem:

1. Hero → "Pare de rasgar dinheiro" → balão do lead sem segmento.
2. Recarregar em `/?ref=industria` → mesmo botão → balão abrindo com "Tenho uma indústria".
3. Dobra 3 → declarar "não tenho site" → confirmar a rolagem automática e o balão de quem não tem site.
4. Dobra 4 → marcar uma frente → "Montar minha pauta" → conferir que a contagem e a lista de faltantes batem com o que está marcado na tela; depois clicar em "Falar sobre esta frente" num card vazio e conferir que o toggle **não** mudou de estado.

Verificar também o console (`read_console_messages`) — nenhum erro — e a aba de rede: os POSTs devem sair com `"action":"intent"`.

- [ ] **Step 5: Commit**

```bash
git add docs/n8n-contrato-agente.md .env.example
git commit -m "docs: contrato do webhook do agente e evento agent_intent"
```

---

## Verificação final

Depois da Task 10:

- `npm run lint` limpo e `npm test` verde.
- Nenhum componente ainda recebe `onWantStrategy` ou `onNoWebsite`.
- `FRONTS_CHAPTER` e `goToFronts` não existem mais em `LandingPage.tsx`.
- O único caminho ao agente é `requestIntent`, então nenhum botão consegue rolar até o chat sem carregar contexto.
- **Pendência externa:** o workflow do n8n precisa do tratamento de `action: "intent"` descrito em `docs/n8n-contrato-agente.md`. Até isso existir, a injeção funciona na tela normalmente — o que falta é a memória da sessão, e a incoerência só apareceria na segunda fala da conversa.
