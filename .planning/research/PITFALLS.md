# Pitfalls Research

**Domain:** AI consulting landing page — React SPA with canvas animation, WhatsApp conversion, Brazilian market
**Researched:** 2026-04-02
**Confidence:** HIGH (code-verified pitfalls) / MEDIUM (SEO/conversion pitfalls from established practices)

---

## Critical Pitfalls

### Pitfall 1: Canvas Animation Loop Never Stops

**What goes wrong:**
`DataWave3D` calls `requestAnimationFrame(render)` inside the loop but never stores the returned animation frame ID. The `useEffect` cleanup removes scroll and resize listeners, but the animation loop itself continues running indefinitely — even after the component unmounts, or when the tab is backgrounded.

**Why it happens:**
The animation ID is not captured in a `ref`, so there is nothing to pass to `cancelAnimationFrame`. This is the single most common canvas memory/battery bug in React.

**How to avoid:**
Capture the animation frame ID in a `ref` declared outside the loop:
```typescript
const animFrameRef = useRef<number>(0);
// inside render():
animFrameRef.current = requestAnimationFrame(render);
// in cleanup:
cancelAnimationFrame(animFrameRef.current);
```
Also use `document.addEventListener('visibilitychange', ...)` to pause when the tab is hidden.

**Warning signs:**
- DevTools Performance tab shows continuous JS activity even when scrolling has stopped
- Mobile battery drains unusually fast while the page is open
- Chrome Task Manager shows the tab consuming >20% CPU at idle

**Phase to address:** Canvas Performance / Mobile Optimization phase

---

### Pitfall 2: Canvas Not Scaled for Device Pixel Ratio

**What goes wrong:**
The canvas width/height are set to `window.innerWidth` / `window.innerHeight` without multiplying by `window.devicePixelRatio`. On Retina/HDPI screens this makes the wave look blurry. On some low-end Android devices the inverse is true — the canvas renders at CSS pixels, which can look sharp but wastes the renderer.

**Why it happens:**
Canvas has two size concepts: its CSS display size (how big it appears) and its drawing buffer size (how many actual pixels). Without matching them to DPR, the drawing surface and the display surface differ.

**How to avoid:**
```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
ctx.scale(dpr, dpr);
// CSS size stays at 100%/100% via the className
```
Add this in both the initial setup and the `handleResize` handler.

**Warning signs:**
- Animation looks fuzzy/pixelated on MacBook or iPhone when compared to desktop screenshot
- The canvas feels "zoomed in" on some Android phones

**Phase to address:** Canvas Performance / Mobile Optimization phase

---

### Pitfall 3: Zero SEO in index.html — Content Invisible to Google

**What goes wrong:**
The current `index.html` has only a `<title>RAI - Revolução da Inteligência Artificial!</title>` and no other meta tags. There is no `<meta name="description">`, no Open Graph tags, no Twitter Card, no canonical URL, and no structured data. React renders all content client-side, so Googlebot sees an empty `<div id="root">` until JS executes.

**Additional bug: brand name typo.** The title says "RAI" but the product is "RIA" (Revolução da Inteligência Artificial).

**Why it happens:**
Vite's default `index.html` template has no SEO markup. Developers add features first and forget static head metadata.

**How to avoid:**
1. Fix `lang="en"` to `lang="pt-BR"` immediately — Google uses this for language targeting.
2. Fix the title typo: "RAI" → "RIA".
3. Add before `</head>`:
```html
<meta name="description" content="Consultoria de IA para empresas brasileiras. Automatize processos, qualifique leads e saia na frente da concorrência. Agende uma sessão estratégica gratuita." />
<meta property="og:title" content="RIA — Revolução da Inteligência Artificial" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://[domain]/og-image.png" />
<meta property="og:url" content="https://[domain]/" />
<meta name="robots" content="index, follow" />
```
4. Add `prerender`/SSG via Vite plugin (`vite-plugin-ssr` or `@vitejs/plugin-react` + `vite-ssg`) OR ensure Googlebot can render the JS (test with Google Search Console's URL Inspection tool after deploy).

**Warning signs:**
- Pasting the URL in WhatsApp shows no preview card
- Google Search Console shows 0 impressions after 4+ weeks
- Sharing on LinkedIn renders no image or description

**Phase to address:** SEO & Meta Tags phase (must be done before any sharing or promotion)

---

### Pitfall 4: WhatsApp CTAs Are Dead Buttons

**What goes wrong:**
Every CTA button on the page (`Iniciar Transformação`, `Agendar Sessão Estratégica`, `Nossa Metodologia`) is a plain `<button>` element with no `onClick` handler. The social links in FinalCTA use `href="#"`. Clicking any primary CTA does nothing. This is the most direct conversion killer on the entire page.

**Why it happens:**
The visual/layout work was done first and the wiring was deferred. The buttons look perfect but are no-ops.

**How to avoid:**
The correct WhatsApp URL format is:
```
https://wa.me/55[DDD][NUMERO]?text=[URL-encoded message]
```
Example for Brazilian number +55 11 99999-9999:
```
https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20sess%C3%A3o%20estrat%C3%A9gica%20gratuita
```
Rules:
- Use `wa.me` not `api.whatsapp.com` — `api.whatsapp.com` is for Business API (server-side), not direct user links
- No spaces, dashes, or parentheses in the phone number — only digits after the `+` country code
- Use `encodeURIComponent()` for the pre-filled message, not manual percent-encoding
- The number must include country code (55) + area code (DDD) + 9-digit mobile number

Buttons should be `<a href="https://wa.me/...">` not `<button>` for CTA links, or use `window.open` in an onClick if staying as buttons.

**Warning signs:**
- Clicking "Iniciar Transformação" produces no visible action
- The WhatsApp icon in FinalCTA goes to `#` (same page top)
- No way to contact Raul from the page as currently deployed

**Phase to address:** WhatsApp Integration & CTA Wiring phase (highest priority — without this the page cannot convert)

---

### Pitfall 5: Canvas Performance Collapse on Low-End Android

**What goes wrong:**
The DataWave3D renders 60 × 45 = 2,700 points and draws up to 59 × 44 = 2,596 filled+stroked quads per frame at 60fps. On a mid-range/low-end Android (Snapdragon 400/600 series, Mali GPU, 2-3 GB RAM — common in the Brazilian market), this can drop to 5-15fps, creating visible lag that makes the page feel broken rather than impressive.

**Why it happens:**
Canvas 2D is CPU-bound. Each `beginPath`, `fill`, `stroke` call is a separate draw command. 2,596 individual fill+stroke operations per frame at 60fps is demanding even on modern hardware. Low-end Android has both slower CPUs and limited GPU acceleration for 2D canvas.

**How to avoid:**
Three tiers of mitigation (implement in order of impact):

1. **Reduce grid dynamically based on device capability**: Check `navigator.hardwareConcurrency` (< 4 cores) or use a quick framerate probe to detect low-end devices and halve the grid (30×22 = 660 quads).

2. **Add a CSS static fallback**: Detect if the device cannot sustain 30fps after 2 seconds and replace the canvas with a CSS gradient animation (`@keyframes` wave using CSS transforms). This guarantees the page is never visually broken.

3. **Reduce per-frame draw calls**: Instead of fill + stroke per quad, try strokeRect or batch strokes with a single `beginPath` per row using polylines. Each saved `beginPath`/`fill`/`stroke` triplet eliminates 3 draw calls.

4. **Add `{ alpha: false }` to `getContext`**: Since the canvas background is always solid black (`fillStyle = '#000000'`), disabling the alpha channel is a free performance win.

**Warning signs:**
- DevTools Performance shows `render` function taking >16ms
- The page feels sluggish to scroll on any phone over 2 years old
- Chrome's CPU throttling test (6x slowdown in DevTools) shows obvious lag

**Phase to address:** Canvas Performance / Mobile Optimization phase

---

### Pitfall 6: Profile Image Breaks with No Fallback

**What goes wrong:**
`About.tsx` references `/raul-pedro.png` — a file that does not exist in `/public`. When this image is missing, the About section shows a broken image icon (browser default) inside the styled frame, which destroys the credibility of the consultant's profile section immediately.

**Why it happens:**
The image path was coded as a placeholder with a comment saying the user should upload it. There is no `onError` handler to catch a missing file.

**How to avoid:**
Two parallel strategies:
1. **Short term**: Add an `onError` handler that hides the `<img>` and shows an elegant SVG/CSS avatar placeholder (initials "RP" in a styled circle).
2. **Long term**: Ensure the actual photo file is placed at `/public/raul-pedro.png` before any production deploy. This must be a deploy checklist item.

**Warning signs:**
- About section shows the browser's default broken-image icon
- The styled frame is empty or shows an "X"
- No 404 error is visible to the user but the credibility damage is immediate

**Phase to address:** Content & Assets phase (profile photo upload + fallback handler)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `href="#"` on CTA buttons | Layout looks complete during development | Page cannot convert — zero leads | Never in production |
| No `cancelAnimationFrame` | Simpler code | Battery drain, memory leak, zombie render loops | Never |
| `lang="en"` on Brazilian page | Vite default untouched | Wrong Google language targeting, hurts pt-BR search ranking | Never |
| No OG meta tags | Faster initial build | Links shared on WhatsApp/LinkedIn show no preview — damages viral spread | Never for a marketing landing page |
| No image fallback | Less code | Broken UI if asset is missing | Never for the consultant's profile photo |
| Single grid resolution for all devices | Simpler code | Visual regression on low-end devices | Only if a CSS fallback is provided |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WhatsApp wa.me | Using `api.whatsapp.com/send?phone=` format | Use `wa.me/[number]?text=` — `api.whatsapp.com` is for server-side Business API |
| WhatsApp wa.me | Including `+` or spaces in number | Number must be pure digits: country code + DDD + number, e.g., `5511999999999` |
| WhatsApp wa.me | Raw UTF-8 in `text=` param | Always `encodeURIComponent()` the message — unencoded accented characters (ã, ç, é) break on some Android browsers |
| WhatsApp wa.me | Opening with `href` on iOS vs Android | `wa.me` links open the WhatsApp app natively on both platforms — no user-agent detection needed |
| WhatsApp pre-filled message | Long, formal message | Keep under 150 characters — the user still has to send it; shorter = lower friction |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `requestAnimationFrame` without cancellation | Battery drain, CPU at 100% when navigating away | Store ID in `useRef`, cancel in cleanup | Immediately on component unmount |
| Canvas without `alpha: false` | Slower compositing | `getContext('2d', { alpha: false })` | Noticeable on mobile immediately |
| Per-quad `fill()` + `stroke()` | >16ms frame time on mobile | Batch by color, reduce draw calls | Low-end Android at full grid (2,596 quads) |
| DPR not applied to canvas buffer | Blurry canvas on Retina | Multiply canvas dimensions by `devicePixelRatio`, call `ctx.scale(dpr, dpr)` | Any HDPI screen (most iPhones, recent Android) |
| No `will-change: transform` on canvas wrapper | Browser doesn't promote layer | Add `will-change: transform` to the canvas container div | Visible scroll jank on mid-range devices |
| Motion `animate` on hero running at mount | Animation runs even for return visitors who load mid-page | Use `whileInView` instead of `animate` for below-fold sections | Only a UX annoyance, not a crash |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Nossa Metodologia" button leads nowhere | User clicks, nothing happens — trust is broken | Link to `#servicos` section or remove the button |
| No visible contact option on mobile hero | Mobile users must scroll past 5 sections to find a CTA | Add sticky mobile CTA bar or ensure hero CTA is wired to WhatsApp |
| Copy says "centenas de leads" but section has no testimonials or case names | Claim feels unsubstantiated | Add 1-2 anonymized client outcomes ("Empresa X do setor financeiro reduzou tempo de qualificação em 70%") |
| "Sem compromisso" + "Gratuito" are buried in a paragraph | Most persuasive trust reducers are not visually prominent | Use icon+badge format (check mark icons) to make these guarantees scannable |
| Scroll indicator (thin white line) is too subtle | Users on mobile may not know the page scrolls | Add `scroll para explorar` text below the line, or use the standard animated chevron |
| About section shows no social proof | Visitor has no way to verify credentials | LinkedIn URL, GitHub, or a specific project name builds instant credibility |

---

## "Looks Done But Isn't" Checklist

- [ ] **Hero CTAs:** Buttons look functional but `onClick` is not connected — verify each button triggers `window.open('https://wa.me/...')` or navigates to a section
- [ ] **Social links in FinalCTA:** `href="#"` on WhatsApp, LinkedIn, Email — verify all three have real URLs
- [ ] **"Nossa Metodologia" button:** Has no scroll target — verify it links to `#servicos` or another valid anchor
- [ ] **Profile photo:** `/raul-pedro.png` file must exist in `/public` — verify file is present before deploy
- [ ] **`index.html` lang attribute:** Currently `lang="en"` — verify changed to `lang="pt-BR"`
- [ ] **`index.html` title:** Currently "RAI" — verify corrected to "RIA"
- [ ] **OG image:** `og:image` meta tag needs an actual image file — verify `/public/og-image.png` exists (1200×630px)
- [ ] **WhatsApp number:** Verify the `wa.me` URL contains Raul's real Brazilian number
- [ ] **Canvas cleanup:** Verify `cancelAnimationFrame` is called in `useEffect` return
- [ ] **`ctx.getContext` options:** Verify `{ alpha: false }` is passed since background is always black
- [ ] **Favicon:** `index.html` has no `<link rel="icon">` — verify favicon.ico or favicon.png is in `/public` and referenced

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dead CTA buttons discovered post-launch | LOW | Add `onClick` or convert to `<a href="wa.me/...">` — 30 min fix |
| Wrong WhatsApp number format causing link failure | LOW | Update the URL string — 5 min fix, redeploy |
| Canvas animation loop not cancelling (battery drain) | LOW | Add `animFrameRef` pattern — 15 min fix |
| Missing profile photo on production | LOW | Upload `raul-pedro.png` to `/public`, redeploy |
| No OG tags (bad social previews) | LOW | Add tags to `index.html`, generate OG image — 1-2 hours |
| Canvas lag on mobile discovered after launch | MEDIUM | Implement DPR scaling + `alpha: false` first (30 min); if still slow, add device detection + static fallback (4-8 hours) |
| SEO invisible to Googlebot | HIGH | Add prerender/SSG — requires evaluating `vite-ssg` or React SSR setup; potentially 1-2 days depending on Vite config complexity |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dead CTA buttons | WhatsApp Integration & CTA Wiring | Click every CTA on desktop and mobile; verify WhatsApp opens with pre-filled message |
| Wrong/missing WhatsApp link format | WhatsApp Integration & CTA Wiring | Test `wa.me` URL on Android and iOS; verify pre-filled text has correct encoding |
| Missing SEO meta tags + lang/title bugs | SEO & Meta Tags | Check with `curl -s [url] \| grep '<meta\|<title\|<html'`; test OG preview at opengraph.xyz |
| Canvas loop never cancelling | Canvas Performance / Mobile Optimization | Unmount component and check CPU in DevTools — should drop to 0% |
| Canvas DPR scaling | Canvas Performance / Mobile Optimization | Screenshot on Retina MacBook — canvas should not look blurry |
| Canvas collapse on low-end Android | Canvas Performance / Mobile Optimization | Test on Chrome DevTools with CPU 6x throttle; must sustain 30fps or show fallback |
| Profile photo missing / no fallback | Content & Assets | Delete `/public/raul-pedro.png` temporarily; verify fallback renders elegantly |
| Social links pointing to `#` | WhatsApp Integration & CTA Wiring | Click each social icon; verify correct external URLs |
| "Nossa Metodologia" dead button | CTA & Navigation Wiring | Click button; verify it scrolls to services section |
| No social proof / unsubstantiated claims | Conversion Optimization | Add 1+ anonymized case outcome to About or WhyNow section |

---

## Sources

- MDN Canvas API: Optimizing Canvas — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas (fetched 2026-04-02, HIGH confidence)
- Source code inspection: `DataWave3D.tsx`, `Hero.tsx`, `FinalCTA.tsx`, `About.tsx`, `index.html` (direct code analysis, HIGH confidence)
- WhatsApp wa.me link format: established specification, MEDIUM confidence (official docs blocked during research — validate against https://faq.whatsapp.com/5913398998672934)
- Google SPA SEO behavior: established pattern, MEDIUM confidence — validate post-deploy with Google Search Console URL Inspection tool
- Canvas `{ alpha: false }` optimization: MDN confirmed, HIGH confidence
- Brazilian mobile market device profile: MEDIUM confidence based on known market data (Snapdragon 400/600 series dominant in budget segment, ~40% of Brazilian smartphone market as of 2024)

---

*Pitfalls research for: RIA — AI consulting landing page, React SPA, Brazilian market*
*Researched: 2026-04-02*
