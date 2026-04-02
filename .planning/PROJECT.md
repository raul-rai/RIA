# RIA — Revolução da Inteligência Artificial

## What This Is

Landing page de alta performance para converter empresários em leads de consultoria de IA. A página usa uma metáfora visual de tsunami — uma onda 3D que se aproxima conforme o usuário scrolla — para transmitir a mensagem central: a IA é inevitável, e quem não se adaptar será engolido. O objetivo é fazer o visitante agendar uma sessão estratégica gratuita de 30 minutos via WhatsApp.

## Core Value

Um empresário que entra na página deve sentir urgência suficiente para clicar em "Agendar" antes de sair — o site converte, não apenas impressiona.

## Requirements

### Validated

- ✓ 3D tsunami wave canvas animado, responsivo ao scroll (DataWave3D) — existente
- ✓ Hero com headline impactante "É UM TSUNAMI." e dois CTAs — existente
- ✓ Seção de serviços com 5 ofertas (Sites+IA, SDR, Automações, Ferramentas, Consultoria) — existente
- ✓ Seção WhyNow com 3 estatísticas de mercado — existente
- ✓ Seção TheChoice com dois cenários (engolido vs dominando) — existente
- ✓ Seção About com Raul Pedro, Engenheiro de Produção / Consultor de IA — existente
- ✓ FinalCTA com "Agendar Sessão Estratégica" — existente
- ✓ Animações Motion por toda a página — existente
- ✓ Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion — existente

### Active

- [ ] CTAs conectados ao WhatsApp com mensagem pré-preenchida (todos os botões "Iniciar Transformação" e "Agendar Sessão Estratégica")
- [ ] Links sociais reais — WhatsApp, LinkedIn, Email no FinalCTA e Footer
- [ ] SEO completo — meta title, description, OG tags para compartilhamento no LinkedIn e WhatsApp
- [ ] Foto de perfil real (raul-pedro.png em /public) ou placeholder elegante
- [ ] Favicon e brand identity RIA
- [ ] Navbar com menu mobile funcional
- [ ] Polimento visual — revisão de cores, tipografia, espaçamentos, micro-interações
- [ ] Performance do canvas em mobile — otimização ou fallback

### Out of Scope

- Backend / servidor para captura de leads — WhatsApp direto é o canal de conversão
- CMS ou painel admin — conteúdo é estático por enquanto
- Múltiplas páginas ou roteamento — landing page de página única
- Autenticação ou área de membros — fora do escopo desta versão
- Blog ou conteúdo dinâmico — v2

## Context

**Proprietário:** Raul Pedro — Engenheiro de Produção, Consultor de IA com experiência no mercado financeiro brasileiro. Já tem agentes de IA em produção qualificando leads.

**Público-alvo:** Empresários brasileiros que ainda não adotaram IA e precisam de um empurrão para agir. Foco em urgência e FOMO competitivo.

**Tom e voz:** Direto, sofisticado, sem enrolação. "Futuro inevitável" — não é hype, é realidade que está chegando. Copywriting já está no tom certo.

**Canal de conversão:** WhatsApp direto com mensagem pré-preenchida. Simples, sem fricção.

**Codebase existente:** React 19 + TypeScript + Vite + Tailwind v4 + Motion. O tsunami 3D canvas (DataWave3D) é o hero visual da página — animação em canvas puro que responde ao scroll, escrito com otimizações manuais de performance.

## Constraints

- **Tech Stack**: React + Vite + Tailwind v4 — não trocar de stack, base já construída
- **Single Page**: Sem React Router — tudo em uma página, ancoragem por IDs
- **Canvas Performance**: O DataWave3D usa ~60 colunas × 45 linhas — qualquer melhoria deve manter ou melhorar a fluidez atual
- **Sem Backend**: Toda captura de leads vai para WhatsApp — sem formulário server-side nesta fase

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WhatsApp como canal de conversão | Menor fricção para o público-alvo brasileiro, Raul já opera via WhatsApp | — Pending |
| Tsunami 3D como hero visual | Reforça a metáfora central da marca, diferencia tecnologicamente da concorrência | — Pending |
| Landing page SPA sem backend | Simplicidade de deploy, foco total na conversão | — Pending |
| Tailwind CSS v4 | Versão mais recente, melhor performance | — Pending |

## Evolution

Este documento evolui a cada transição de fase e marco de milestone.

---
*Last updated: 2026-04-02 após inicialização*
