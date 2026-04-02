# Feature Landscape

**Domain:** AI Consulting Landing Page — Brazilian B2B market, WhatsApp conversion
**Researched:** 2026-04-02
**Confidence note:** Web search unavailable. Analysis is based on (a) full audit of existing codebase, (b) training knowledge on CRO principles for consulting pages, (c) Brazil-specific conversion patterns (WhatsApp-first, high-context trust requirements). Confidence labeled per claim.

---

## Current State Audit

The site has the following sections in order:
1. **Navbar** — exists, mobile menu not yet functional
2. **Hero** — tsunami headline + "Iniciar Transformação" + "Nossa Metodologia" CTAs (buttons not wired to WhatsApp)
3. **Services** — 5 service cards (Sites+IA, SDR, Automações, Ferramentas, Consultoria)
4. **WhyNow** — 3 market stats with FOMO framing
5. **TheChoice** — two scenario contrast (engolido vs dominando)
6. **About** — Raul Pedro bio with credential bullets, photo placeholder
7. **FinalCTA** — "Agendar Sessão Estratégica" button (not wired) + social icons (all href="#")
8. **Footer** — logo + social icons (all href="#")

**Critical gap:** Every conversion action on the page leads nowhere. Zero CTAs are functional.

---

## Table Stakes

Features users expect. Missing = visitors bounce or lose trust.

| Feature | Why Expected | Complexity | Current Status | Notes |
|---------|--------------|------------|----------------|-------|
| WhatsApp CTA wired with pre-filled message | Brazilian b2b visitors click WhatsApp expecting instant conversation; a dead button signals "not serious" | Low | MISSING — all buttons are `<button>` with no href/action | wa.me link with encoded message; applies to ALL CTAs on page |
| Functional navigation links | Navbar and footer links must resolve to real destinations; broken links destroy trust | Low | PARTIAL — navbar exists, mobile menu broken, footer social links are "#" | Anchor IDs exist on sections; NavBar needs to scroll-link them |
| Mobile-responsive CTAs | Brazil mobile internet usage is ~80%+ of web traffic; buttons must be thumb-reachable and functional on mobile | Low | PARTIAL — layout is responsive, but mobile nav menu is broken | Fix hamburger menu; test CTA button tap targets |
| Real photo of consultant | Consulting is a high-trust, face-to-face category; a missing or broken image (placeholder raul-pedro.png) signals fake or unfinished | Low | MISSING — /public/raul-pedro.png does not exist | Upload actual headshot; image is already wired in About.tsx |
| Credential specificity in About section | "Engenheiro de Produção" and "mercado financeiro" are credible; vague claims ("years of experience") feel generic | Low | PARTIAL — bullets exist but lack specifics (no numbers: how many clients, companies, ROI) | Add 1–2 concrete results (e.g., "R$2M em leads qualificados automaticamente") |
| SEO meta tags | Without og:title, og:description, og:image, WhatsApp link previews show blank cards — catastrophic for a WhatsApp-driven funnel | Low | MISSING — no meta tags in index.html beyond defaults | Add title, description, og:image (1200×630), canonical |
| Contact info in footer | Visitors who don't click the main CTA will look for an email or phone; an empty footer signals abandonment | Low | MISSING — footer icons are all "#" | Wire MessageCircle → WhatsApp, Linkedin → real URL, Mail → mailto: |
| Favicon | Browser tabs without a favicon look like unfinished projects; subtle but affects perceived legitimacy | Low | MISSING — no favicon visible in project | Add brand favicon, 32×32 and 180×180 for Apple |
| Scroll-anchored navigation | Visitors who scroll down and lose orientation will leave; a sticky navbar with working anchor links prevents disorientation | Low | PARTIAL — Navbar component exists but anchor behavior untested/unfunctional | Implement smooth-scroll to #servicos, #sobre, #contato |

---

## Differentiators

Features that set this page apart from generic AI consulting sites. Not expected, but meaningfully increase conversion.

| Feature | Value Proposition | Complexity | Dependency | Notes |
|---------|-------------------|------------|------------|-------|
| Pre-filled WhatsApp message with context | "Olá Raul, vi seu site e quero entender como a IA pode transformar meu negócio" removes the blank-message anxiety that kills WhatsApp conversion; visitor arrives warm | Low | Requires WhatsApp number | Encode via `wa.me/55XXXXXXXXXXX?text=...`; HIGH confidence this pattern works in BR market |
| Numbered/named service CTAs | Each service card linking to a WhatsApp with context ("Quero saber mais sobre Agente SDR") lets Raul qualify intent before the call | Low | WhatsApp number | Distinct pre-fill per service increases conversation relevance |
| "Quanto custa?" objection handling | Brazilian SMBs bounce when pricing is invisible; even "A partir de R$X" or a "consulta gratuita para orçamento" line reduces sticker-shock paralysis | Low | None | Can be inline text under FinalCTA, not a full section |
| Resultado/case number in hero or About | One concrete number ("Automatizei R$X em vendas", "Reduzi X% do tempo de qualificação") turns vague claims into proof; consulting buyers need evidence | Low | Real data from Raul | This is copywriting, not engineering; highest leverage per effort |
| Sticky floating WhatsApp button | A persistent green WhatsApp button (bottom-right, FAB pattern) captures visitors who read the full page without clicking any section CTA; industry standard in BR | Low | None | Common pattern; does not interfere with existing layout |
| Social proof / logos or results | Even a 1-line "Empresas atendidas" or 2–3 anonymous case results ("PME do setor financeiro: +40% em conversão de leads") build credibility for first-time visitors | Medium | Real client data or anonymized results | Without client logos, results-as-text work; avoid fabrication |
| Urgency reinforcement at CTA | TheChoice section sets up the urgency but FinalCTA does not close the loop; "Apenas X vagas abertas este mês" or "Respondo em até 2h" increases scarcity/speed perception | Low | None — copywriting only | MEDIUM confidence; works for consulting, risky if not credible |
| LinkedIn social proof badge | A visible LinkedIn profile link near the About section lets skeptical visitors verify credentials independently; especially valued by corporate buyers | Low | Real LinkedIn URL | Single `<a>` tag addition to About section |
| Scroll progress indicator | The page is long; a subtle progress bar (already has scroll-linked animations) signals to the visitor they are "almost there" before the CTA | Low | None | Optional; lower priority than functional CTAs |

---

## Anti-Features

Features to explicitly NOT build for v1. Each adds complexity or noise without conversion benefit.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Contact form / lead capture form | Adds friction; Brazilian SMBs prefer WhatsApp over email forms; a form also requires backend, which is out of scope | Use WhatsApp wa.me link directly |
| Calendly / booking widget embed | Adds a 3rd-party dependency, slow to load, often breaks on mobile, and creates a scheduling step before Raul has qualified the lead | WhatsApp first, then Raul books the call in chat |
| Chat widget (Intercom, Tidio, etc.) | A bot chat widget competes visually with the WhatsApp CTA and adds JS weight; the irony of an AI consultant using generic bot chat is brand-negative | WhatsApp is the chat |
| Pricing table | Consulting pricing is highly variable; a table invites comparison shopping and anchors expectations before discovery; Raul's model requires a diagnostic first | One line: "Sessão gratuita de diagnóstico de 30min" handles the value exchange |
| Blog / articles section | Good for SEO long-term but irrelevant for immediate conversion; distracts from the single goal; scope creep for v1 | v2 |
| Video embed (YouTube/Vimeo) | Heavy to load, autoplay creates bad mobile UX, and a page this visually dense (3D canvas) doesn't need more media | If ever used: a short Loom-style 60-sec testimonial video could work in v2 |
| Multiple language versions | The copy is precisely tuned for Brazilian Portuguese; an English version for "international reach" diffuses the audience focus | Single language, single market |
| Newsletter signup / email list | Adds friction, no backend, and the funnel is WhatsApp-first; email opt-in is a different product entirely | Capture intent via WhatsApp |
| Testimonial slider / carousel | Carousels are consistently shown to reduce engagement (visitors don't interact with them); if testimonials exist, use static cards | Static 2–3 quote cards if testimonials exist |
| Cookie consent banner | Not required for a static page with no analytics cookies; adds visual clutter on arrival | If analytics added later, use simple `<script>` GA4 without consent for anonymized data or use privacy-first tools (Plausible) |

---

## Feature Dependencies

```
WhatsApp number (real) → ALL CTA wiring
                       → Pre-filled message CTAs
                       → Floating WhatsApp button
                       → Footer contact link

Real photo (raul-pedro.png) → About section credibility
                             → og:image for SEO/share

Real LinkedIn URL → About section link
                  → Footer LinkedIn icon

Real results/numbers → Credential specificity in About
                     → Social proof section (if added)

SEO meta tags → og:image → Real photo or branded image
             → og:description → Finalized copy

Navbar anchor links → Section IDs (already exist: #servicos, #sobre, #a-escolha, #contato)
```

---

## MVP Recommendation

The current page is visually complete but functionally broken. The v1 milestone should focus on making existing elements work, not adding new sections.

**Priority 1 — Functional (all Low complexity, all blocking conversion):**
1. Wire ALL CTAs to WhatsApp wa.me with pre-filled message
2. Wire social links (WhatsApp, LinkedIn, Email) in FinalCTA and Footer
3. Upload real headshot to /public/raul-pedro.png
4. Add SEO meta tags (title, description, og:image, og:description) to index.html
5. Fix mobile navigation menu
6. Add favicon

**Priority 2 — High Leverage (Low complexity, significant conversion uplift):**
7. Add floating WhatsApp FAB button (sticky, bottom-right)
8. Add one concrete result number to About section copy
9. Fix Navbar anchor scroll behavior

**Priority 3 — Differentiators (Low-Medium complexity, nice to have for v1):**
10. Add "Apenas X vagas" or "Respondo em 2h" micro-copy under FinalCTA button
11. Add LinkedIn profile link visibly in About section
12. Per-service WhatsApp CTAs (each service card has a distinct message)

**Defer to v2:**
- Social proof / client logos / case results (requires real data)
- Blog / content section
- Analytics integration

---

## WhatsApp-Specific CTA Patterns (Brazilian Market)

MEDIUM confidence — based on training data on BR e-commerce and consulting conversion patterns, not verified via live search.

**wa.me URL format:**
```
https://wa.me/5511XXXXXXXXX?text=Olá%20Raul%2C%20vi%20seu%20site%20e%20quero%20entender%20como%20a%20IA%20pode%20transformar%20meu%20negócio.
```

**Message framing principles:**
- Open with "Olá Raul" — personal address signals human contact, not spam
- State origin — "vi seu site" establishes context for Raul to respond relevantly
- State intent briefly — "quero entender como a IA pode transformar meu negócio" qualifies the lead before any conversation starts
- Do NOT pre-fill too long — visitors will edit or delete a long message; keep under 120 chars
- Do NOT pre-fill urgency-language — "preciso urgente" feels fake; let visitors feel ownership of the message

**Per-section message variants:**
- Hero CTA: "Olá Raul, vi seu site e quero agendar uma sessão estratégica gratuita."
- Services - SDR: "Olá Raul, quero saber mais sobre o Agente SDR para WhatsApp."
- Services - Consultoria: "Olá Raul, quero receber um diagnóstico de IA para minha empresa."
- FinalCTA: "Olá Raul, quero agendar minha sessão estratégica de 30 minutos."

**Floating FAB behavior:**
- Appears after 30% scroll depth (visitor has shown intent by reading)
- Does NOT appear on initial page load (avoids instant-pop aggression)
- WhatsApp green (#25D366) is universally recognized in Brazil; use brand color or green
- "Falar no WhatsApp" label preferred over icon-only on desktop

---

## Gaps to Address in Later Research

- **Actual WhatsApp number** — Required before any wiring work begins. Raul must provide.
- **Real LinkedIn URL** — Required for social proof links.
- **Client data/results** — Required before adding social proof section. Fabricated numbers destroy trust if discovered.
- **Analytics strategy** — Once live, which tool to use (GA4 vs Plausible vs none) needs decision. Affects future SEO and iteration speed.
- **og:image asset** — Needs design decision: use real headshot, or create branded 1200×630 image.

---

## Sources

- Codebase audit: full read of all `.tsx` component files (HIGH confidence — first-hand)
- PROJECT.md requirements and constraints (HIGH confidence — first-hand)
- CRO principles for B2B consulting landing pages: training knowledge (MEDIUM confidence — unverified against live search)
- WhatsApp wa.me URL format and pre-fill behavior: training knowledge, widely documented (HIGH confidence)
- Brazilian mobile internet / WhatsApp adoption patterns: training knowledge (MEDIUM confidence — statistics may be slightly stale but directionally correct)
- Carousel anti-pattern (reduced engagement): well-documented in CRO literature (HIGH confidence)
