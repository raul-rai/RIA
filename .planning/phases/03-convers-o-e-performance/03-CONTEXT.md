# Phase 3: Conversão e Performance — Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

FAB flutuante do WhatsApp + otimizações de performance do canvas DataWave3D para dispositivos mobile de baixo custo.

**In scope:** Novo componente `WhatsAppFAB.tsx`, modificações em `DataWave3D.tsx` (resolução mobile, prefers-reduced-motion, DPR), adição de `WHATSAPP_URL_FAB` em `constants/links.ts`.
**Out of scope:** Redesign de outros componentes, SEO, analytics, backend.

</domain>

<decisions>
## Implementation Decisions

### FAB Visual & Identidade
- **D-01:** Icon-only, 56px circle — nenhum label de texto. O ícone do WhatsApp é universalmente reconhecido no Brasil; label seria peso visual desnecessário.
- **D-02:** Cor de fundo `--color-cta` (#2a42ec) — mantém identidade visual da marca, não usa verde padrão do WhatsApp.
- **D-03:** Efeito pulse suave por 2-3 ciclos após a primeira aparição, depois estático — chama atenção sem irritar.
- **D-04:** Animação de entrada com Motion: `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}` com spring suave — mesma linguagem dos outros componentes existentes.
- **D-05:** Drop-shadow para elevação de floating element; posição bottom-right com 20-24px de margem das bordas.

### FAB Mensagem WhatsApp
- **D-06:** Criar `WHATSAPP_URL_FAB` em `src/constants/links.ts` com mensagem própria:
  ```
  "Olá Raul, estou visitando seu site e gostaria de saber mais sobre consultoria de IA."
  ```
  Mensagem mais suave que o FinalCTA (usuário ainda em modo "considerando"), mais específica que a URL genérica.

### FAB Comportamento de Visibilidade
- **D-07:** FAB aparece após 30% de scroll (≈ `window.scrollY / document.documentElement.scrollHeight >= 0.3`).
- **D-08:** FAB esconde quando o FinalCTA (`#contato`) está visível no viewport — usar `IntersectionObserver` no elemento `#contato`. Quando FinalCTA sai do viewport, FAB reaparece. Evita dois CTAs de WhatsApp visíveis simultaneamente.

### Canvas DataWave3D — Mobile Performance
- **D-09:** Resolução reduzida em viewport < 768px: `cols=30, rows=22` (em vez de 60×45). Checar `window.innerWidth` na inicialização do `useEffect`.
- **D-10:** `devicePixelRatio` limitado a `Math.min(window.devicePixelRatio, 1.5)` no canvas setup. Aplicar ao definir `canvas.width` e `canvas.height`.

### Canvas DataWave3D — prefers-reduced-motion
- **D-11:** Quando `window.matchMedia('(prefers-reduced-motion: reduce)').matches` for verdadeiro: renderizar exatamente 1 frame (t=0, currentScroll=0, sem scroll listener ativo) e NÃO chamar `requestAnimationFrame` em loop. O frame inicial (grade 3D em repouso, onda distante) é visualmente rico e semanticamente correto.

### Claude's Discretion
- Ícone exato do WhatsApp dentro do FAB (SVG inline ou componente icon — Claude decide o mais limpo).
- Tamanho exato do shadow e blur do drop-shadow.
- Threshold exato do IntersectionObserver para hide/show do FAB (rootMargin para trigger antecipado).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos da fase
- `.planning/REQUIREMENTS.md` — CTA-06, PERF-01, PERF-02, PERF-03 (todos pending)
- `.planning/ROADMAP.md` — Phase 3 deliverables e success criteria

### Código existente a modificar
- `src/components/DataWave3D.tsx` — Componente a otimizar: cols/rows atuais (60×45), sem DPR handling, sem prefers-reduced-motion
- `src/constants/links.ts` — Adicionar WHATSAPP_URL_FAB seguindo padrão existente
- `src/App.tsx` — Para montar o FAB no layout (verificar estrutura existente)

### Padrões de referência
- `src/components/Hero.tsx` — Padrão Motion usado: `{ initial, animate, transition }` com `motion/react`
- `src/components/Navbar.tsx` — Padrão de scroll listener e estado React
- `src/components/FinalCTA.tsx` — Elemento com `id="contato"` (ou similar) para IntersectionObserver

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `motion` from `motion/react` — já instalado, padrão `{ initial, animate, transition }` com spring/ease
- `constants/links.ts` — Adicionar `WHATSAPP_URL_FAB` seguindo o padrão dos exports existentes
- Tailwind `--color-cta` token — disponível para uso no FAB

### Established Patterns
- State management com `useState` + `useEffect` para scroll listeners (ver Navbar)
- Canvas setup em `useEffect` com cleanup (DataWave3D já tem esse padrão correto)
- Animações com Motion `motion.div` — `initial/animate/transition` já estabelecido

### Integration Points
- O FAB é um novo componente montado em `src/App.tsx` — fora do `main` content, sempre visible no DOM após 30% scroll
- `DataWave3D.tsx` — modificar `useEffect` interno para checar viewport, DPR e prefers-reduced-motion antes de iniciar o loop

</code_context>

<specifics>
## Specific Ideas

- FAB deve usar o ícone oficial do WhatsApp (SVG) dentro de um `motion.a` ou `motion.button` com `href` para `WHATSAPP_URL_FAB`
- Pulse animation: CSS `@keyframes` via Tailwind `animate-ping` (já disponível no Tailwind) como overlay semi-transparente que desaparece após algumas iterações
- O frame estático do canvas com prefers-reduced-motion deve ter `currentScroll=0` e `time=0` — mostra a grade com a onda ao fundo ainda distante

</specifics>

<deferred>
## Deferred Ideas

- Analytics de cliques no FAB (CTA-06 click tracking) — v2 com Cloudflare Analytics
- Resize listener no DataWave3D para re-inicializar cols/rows quando viewport muda (ex: rotação de tela) — não está no escopo desta fase
- Sitemap.xml e robots.txt — após ter domínio real

</deferred>

---

*Phase: 03-convers-o-e-performance*
*Context gathered: 2026-04-07*
