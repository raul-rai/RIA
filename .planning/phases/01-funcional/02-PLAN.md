---
phase: 01-funcional
plan: 02
type: execute
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - src/components/Hero.tsx
  - src/components/FinalCTA.tsx
autonomous: true
requirements:
  - CTA-01
  - CTA-02
  - CTA-03
  - CTA-04
  - CTA-05

must_haves:
  truths:
    - "Clicking 'Iniciar Transformação' in Hero opens WhatsApp with pre-filled message"
    - "Clicking 'Agendar Sessão Estratégica' in FinalCTA opens WhatsApp with pre-filled message"
    - "Clicking the MessageCircle icon in FinalCTA opens WhatsApp"
    - "Clicking the Mail icon in FinalCTA opens the email client with mailto:contato@ria.com.br"
    - "Clicking 'Nossa Metodologia' in Hero smoothly scrolls the page to the #servicos section"
  artifacts:
    - path: "src/components/Hero.tsx"
      provides: "Wired CTAs — WhatsApp anchor and smooth-scroll metodologia button"
      contains: "WHATSAPP_URL_HERO"
    - path: "src/components/FinalCTA.tsx"
      provides: "Wired CTAs — WhatsApp anchor, social icon links"
      contains: "WHATSAPP_URL_CTA"
  key_links:
    - from: "src/components/Hero.tsx"
      to: "src/constants/links.ts"
      via: "import { WHATSAPP_URL_HERO } from '../constants/links'"
      pattern: "WHATSAPP_URL_HERO"
    - from: "src/components/FinalCTA.tsx"
      to: "src/constants/links.ts"
      via: "import { WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL, LINKEDIN_URL } from '../constants/links'"
      pattern: "WHATSAPP_URL_CTA"
    - from: "Hero 'Nossa Metodologia' button"
      to: "#servicos section"
      via: "onClick scrollTo handler"
      pattern: "scrollTo.*servicos"
---

<objective>
Wire all Hero and FinalCTA conversion points to their real destinations: WhatsApp deep links and the email client.

Purpose: Every user-facing CTA on the page currently goes nowhere. This plan makes the page functional for conversion. Plan 01 must complete first (provides constants/links.ts).
Output: Hero.tsx and FinalCTA.tsx with all buttons and icon links wired.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-funcional/01-RESEARCH.md
@.planning/phases/01-funcional/01-01-SUMMARY.md

<!-- Interface contracts from Plan 01 (src/constants/links.ts) -->
<interfaces>
From src/constants/links.ts (created in Plan 01):

```typescript
export const WHATSAPP_URL_HERO: string;  // wa.me URL with "sessão estratégica gratuita" pre-filled
export const WHATSAPP_URL_CTA: string;   // wa.me URL with "30 minutos" booking message pre-filled
export const WHATSAPP_URL: string;       // wa.me URL with no pre-filled text
export const EMAIL: string;              // 'contato@ria.com.br' (mailto: target)
export const LINKEDIN_URL: string;       // '#' (placeholder)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire Hero CTAs</name>
  <files>src/components/Hero.tsx</files>

  <read_first>
    - src/components/Hero.tsx (full file — buttons at lines 46 and 51)
    - src/constants/links.ts (verify exports exist before importing)
    - .planning/phases/01-funcional/01-RESEARCH.md (Pattern 2 — anchor tag for external nav, Pattern 6 — smooth scroll with offset)
  </read_first>

  <action>
Make the following changes to src/components/Hero.tsx:

**Change 1 — Add import at the top of the file (after the existing imports):**
```typescript
import { WHATSAPP_URL_HERO } from '../constants/links';
```

**Change 2 — "Iniciar Transformação" button (currently line 46):**
Replace the `<button>` element with an `<a>` element. Keep all existing className values and children unchanged. Only the element type and attributes change:

BEFORE:
```tsx
<button className="w-full sm:w-auto group relative px-8 py-4 bg-white/90 backdrop-blur-sm text-black rounded-full font-medium text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
  <span className="relative z-10">Iniciar Transformação</span>
  <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" size={20} />
</button>
```

AFTER:
```tsx
<a
  href={WHATSAPP_URL_HERO}
  target="_blank"
  rel="noopener noreferrer"
  className="w-full sm:w-auto group relative px-8 py-4 bg-white/90 backdrop-blur-sm text-black rounded-full font-medium text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3"
>
  <span className="relative z-10">Iniciar Transformação</span>
  <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" size={20} />
</a>
```

**Change 3 — "Nossa Metodologia" button (currently line 51):**
Keep it as a `<button>` but add an `onClick` handler that smooth-scrolls to the `#servicos` section with an 80px navbar offset:

BEFORE:
```tsx
<button className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 text-white font-medium text-lg hover:bg-white/5 transition-all duration-300 flex items-center justify-center">
  Nossa Metodologia
</button>
```

AFTER:
```tsx
<button
  className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 text-white font-medium text-lg hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
  onClick={() => {
    const el = document.getElementById('servicos');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }}
>
  Nossa Metodologia
</button>
```

Do not change any Motion animation props, className values, or other children. Do not add any additional imports beyond the one specified.
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run lint 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - grep "WHATSAPP_URL_HERO" src/components/Hero.tsx returns a match (import + usage)
    - grep 'href={WHATSAPP_URL_HERO}' src/components/Hero.tsx returns a match
    - grep 'target="_blank"' src/components/Hero.tsx returns a match
    - grep 'rel="noopener noreferrer"' src/components/Hero.tsx returns a match
    - grep "getElementById('servicos')" src/components/Hero.tsx returns a match
    - grep "window.scrollTo" src/components/Hero.tsx returns a match
    - grep "behavior: 'smooth'" src/components/Hero.tsx returns a match
    - grep "window.scrollY - 80" src/components/Hero.tsx returns a match
    - npm run lint passes with no errors on this file
  </acceptance_criteria>

  <done>"Iniciar Transformação" is an anchor tag pointing to WHATSAPP_URL_HERO with target="_blank". "Nossa Metodologia" onClick scrolls to #servicos with 80px offset. Lint passes.</done>
</task>

<task type="auto">
  <name>Task 2: Wire FinalCTA CTAs and social icons</name>
  <files>src/components/FinalCTA.tsx</files>

  <read_first>
    - src/components/FinalCTA.tsx (full file — button at line 44, social icon anchors at lines 50, 54, 58)
    - src/constants/links.ts (verify exports before importing)
    - .planning/phases/01-funcional/01-RESEARCH.md (Pattern 2 — anchor tag pattern)
  </read_first>

  <action>
Make the following changes to src/components/FinalCTA.tsx:

**Change 1 — Add import (after existing imports on lines 1-4):**
```typescript
import { WHATSAPP_URL_CTA, WHATSAPP_URL, EMAIL, LINKEDIN_URL } from '../constants/links';
```

**Change 2 — "Agendar Sessão Estratégica" button (currently line 44):**
Replace the `<button>` with an `<a>` element. Keep all existing className and children unchanged:

BEFORE:
```tsx
<button className="group relative px-10 py-5 bg-white/90 backdrop-blur-sm text-black rounded-full font-display font-medium text-xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center gap-3">
  <span className="relative z-10">Agendar Sessão Estratégica</span>
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</button>
```

AFTER:
```tsx
<a
  href={WHATSAPP_URL_CTA}
  target="_blank"
  rel="noopener noreferrer"
  className="group relative px-10 py-5 bg-white/90 backdrop-blur-sm text-black rounded-full font-display font-medium text-xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] flex items-center gap-3"
>
  <span className="relative z-10">Agendar Sessão Estratégica</span>
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</a>
```

**Change 3 — MessageCircle icon anchor (currently line 50, href="#"):**
Replace `href="#"` with `href={WHATSAPP_URL}` and add target and rel:

BEFORE:
```tsx
<a href="#" className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
  <MessageCircle size={24} />
  <span className="sr-only">WhatsApp</span>
</a>
```

AFTER:
```tsx
<a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
  <MessageCircle size={24} />
  <span className="sr-only">WhatsApp</span>
</a>
```

**Change 4 — Linkedin icon anchor (currently line 54, href="#"):**
Replace `href="#"` with `href={LINKEDIN_URL}`. Do NOT add target="_blank" since LINKEDIN_URL is currently '#' (would open new tab on placeholder):

BEFORE:
```tsx
<a href="#" className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
  <Linkedin size={24} />
  <span className="sr-only">LinkedIn</span>
</a>
```

AFTER:
```tsx
<a href={LINKEDIN_URL} className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
  <Linkedin size={24} />
  <span className="sr-only">LinkedIn</span>
</a>
```

**Change 5 — Mail icon anchor (currently line 58, href="#"):**
Replace `href="#"` with `href={\`mailto:${EMAIL}\`}`:

BEFORE:
```tsx
<a href="#" className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
  <Mail size={24} />
  <span className="sr-only">Email</span>
</a>
```

AFTER:
```tsx
<a href={`mailto:${EMAIL}`} className="text-muted hover:text-white transition-colors p-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
  <Mail size={24} />
  <span className="sr-only">Email</span>
</a>
```

Do not change Motion animation props, useInView logic, or className values on anything else.
  </action>

  <verify>
    <automated>cd "C:/Users/raulp/OneDrive/Área de Trabalho/Projetos/RIA" && npm run lint 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - grep "WHATSAPP_URL_CTA" src/components/FinalCTA.tsx returns a match (import + usage)
    - grep 'href={WHATSAPP_URL_CTA}' src/components/FinalCTA.tsx returns a match
    - grep 'href={WHATSAPP_URL}' src/components/FinalCTA.tsx returns a match (MessageCircle icon)
    - grep 'href={LINKEDIN_URL}' src/components/FinalCTA.tsx returns a match
    - grep 'mailto:' src/components/FinalCTA.tsx returns a match (Mail icon)
    - grep 'href="#"' src/components/FinalCTA.tsx returns no match (all # placeholders replaced)
    - npm run lint passes with no errors on this file
    - npm run build succeeds
  </acceptance_criteria>

  <done>All four href="#" placeholders in FinalCTA are replaced with real destinations. The main CTA button is an anchor pointing to WHATSAPP_URL_CTA. Social icons link to WhatsApp, LinkedIn constant, and mailto. Lint and build pass.</done>
</task>

</tasks>

<verification>
After both tasks:
- npm run build exits 0 with no TypeScript errors
- No hardcoded wa.me URLs or mailto strings remain in Hero.tsx or FinalCTA.tsx (all come through constants)
- grep 'href="#"' src/components/Hero.tsx returns no match
- grep 'href="#"' src/components/FinalCTA.tsx returns no match
</verification>

<success_criteria>
- npm run build exits 0
- All conversion buttons and icons in Hero and FinalCTA have real destinations
- Zero hardcoded contact URLs in component files
- Manual test: clicking "Iniciar Transformação" opens WhatsApp with pre-filled message
- Manual test: clicking "Agendar Sessão Estratégica" opens WhatsApp with pre-filled message
- Manual test: clicking "Nossa Metodologia" scrolls smoothly to the services section
</success_criteria>

<output>
After completion, create .planning/phases/01-funcional/01-02-SUMMARY.md with:
- Files modified
- Confirmation that all href="#" are replaced
- Note on which constants each component imports
</output>
