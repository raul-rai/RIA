# RIA — Revolução da Inteligência Artificial

Landing page de conversão para consultoria de IA. React 19 + Vite 6 + Tailwind 4 + Motion.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencher os dois webhooks n8n
npm run dev
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm run lint` | Checagem de tipos (`tsc --noEmit`) |
| `npm test` | Testes de contrato (Vitest) |

## Estrutura

- `src/pages/LandingPage.tsx` — a narrativa de 7 capítulos
- `src/components/DataWave3D.tsx` — o tsunami em canvas, dirigido pelo scroll
- `src/config.ts` — endpoints n8n (única fonte)
- `src/constants/links.ts` — contatos (única fonte)
- `docs/superpowers/specs/` — decisões de design
