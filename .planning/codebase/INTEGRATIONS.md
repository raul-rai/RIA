# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**AI / Generative:**
- Google Gemini AI - Generative AI capabilities (chatbot, content, etc.)
  - SDK/Client: `@google/genai` ^1.29.0
  - Auth: `GEMINI_API_KEY` environment variable
  - Status: SDK declared as dependency and API key exposed via Vite `define` in `vite.config.ts`; no active import in `src/` — integration is scaffolded but not yet implemented in components

## Data Storage

**Databases:**
- None detected. No database client, ORM, or connection string patterns found in `src/` or configuration files.

**File Storage:**
- None detected. No cloud storage SDK (S3, GCS, Cloudinary, etc.) found.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- None detected. No auth library (NextAuth, Supabase Auth, Firebase Auth, Auth0, Clerk, etc.) found in `package.json` or `src/`.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, or similar SDK found.

**Analytics:**
- None detected. No GA, Mixpanel, Posthog, or similar found.

**Logs:**
- Browser `console` only (no structured logging library).

## CI/CD & Deployment

**Hosting:**
- Google AI Studio / Cloud Run (inferred from `metadata.json` app name, `.env.example` comments referencing "AI Studio automatically injects this at runtime from user secrets" and "Cloud Run service URL")

**CI Pipeline:**
- Not detected. No `.github/workflows/`, `.gitlab-ci.yml`, or similar found.

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - Gemini AI API key; injected into frontend bundle at build time via Vite `define` in `vite.config.ts`
- `APP_URL` - Deployed app URL; for self-referential links, OAuth callbacks, API endpoints
- `DISABLE_HMR` - Optional; set to `"true"` to disable Vite HMR (used by AI Studio to prevent flickering during agent edits)

**Secrets location:**
- `.env` file at project root (not committed; template at `.env.example`)
- In AI Studio: secrets injected automatically at runtime via Secrets panel

## Social / Communication Links

**Present in UI (placeholder `#` href — not yet wired):**
- WhatsApp - linked via `MessageCircle` icon in `src/components/FinalCTA.tsx` and `src/components/Footer.tsx`
- LinkedIn - linked via `Linkedin` icon in `src/components/FinalCTA.tsx` and `src/components/Footer.tsx`
- Email - linked via `Mail` icon in `src/components/FinalCTA.tsx` and `src/components/Footer.tsx`

All three social links currently use `href="#"` placeholders and have not been configured with real URLs.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

## Express Server

**Status:** `express` ^4.21.2 and `@types/express` are declared in `package.json` but no server entry file (e.g., `server.ts`, `api/index.ts`) exists in the codebase. This is scaffolded for future backend/API route implementation.

---

*Integration audit: 2026-04-02*
