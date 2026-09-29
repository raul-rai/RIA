import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Guarda de POSICIONAMENTO.
 *
 * A página deixou de sustentar a tese "IA importa" e passou a fazer uma coisa
 * só: medir o site do visitante em duas notas independentes e oferecer criar
 * ou otimizar. A parede de vídeos 3D ("Vozes do mercado") emprestava autoridade
 * à tese antiga e saiu por decisão de posicionamento, não por defeito — ver
 * docs/superpowers/specs/2026-09-28-foco-em-sites-duas-notas-design.md.
 *
 * Este arquivo trava o que já vale hoje: os arquivos que saíram não voltam e a
 * política de privacidade descreve só os terceiros que existem.
 *
 * FICA PARA A TASK 11: a guarda de VOCABULÁRIO, que proíbe "Diagnóstico de
 * Gargalo" e "três frentes" em src/ e scripts/. content/offer.ts, meta.ts e
 * scripts/prerender.js só são reescritos lá; escrever a guarda antes disso seria
 * vê-la falhar ou afrouxá-la para passar.
 */

const root = (p: string) => resolve(process.cwd(), p);

describe('POS: os arquivos removidos não voltam', () => {
  const REMOVIDOS = [
    'src/components/SocialProofSection.tsx',
    'src/components/VideoWall3D.tsx',
    'src/components/AuthorityCard.tsx',
    'src/components/AuthorityAccordion.tsx',
    'src/components/AwarenessCheck.tsx',
    'src/components/VideoModal.tsx',
    'src/components/PotentialDiagnostic.tsx',
    'src/components/FrontsSection.tsx',
    'src/content/proofPanels.ts',
    'src/constants/socialNetworks.ts',
    'src/context/VulnerabilityContext.tsx',
    'src/hooks/useOrbitWall.ts',
    'src/lib/orbit-wall.ts',
    'src/lib/youtube.ts',
    'src/lib/agentic-readiness.ts',
    'public/autoridades',
  ];

  /**
   * AINDA NÃO ESTÃO NESTA LISTA, e a ausência é deliberada e datada:
   *
   *   - src/content/authorities.ts — entra na Task 11. Ele ainda alimenta os
   *     campos `authorities`/`authoritiesDisclaimer` do agent-context.json
   *     publicado para agentes, via scripts/build-agent-context.ts. Apagá-lo
   *     antes derrubaria `npm run build`. A Task 11 remove esses campos e o
   *     arquivo juntos.
   *   - src/content/fronts.ts e src/lib/fronts.ts — entram na Task 11 pelo
   *     mesmo motivo: prerender.js, build-agent-context.ts, entry-server.tsx e
   *     AboutPage.tsx ainda os leem.
   */
  it('POS-ARQ: nenhum deles existe', () => {
    expect(REMOVIDOS.filter((p) => existsSync(root(p)))).toEqual([]);
  });
});

describe('POS: privacidade descreve só os terceiros que existem', () => {
  it('POS-PRIV: nenhuma menção a YouTube na política', () => {
    const privacy = readFileSync(root('src/content/privacy.ts'), 'utf-8');
    expect(privacy.toLowerCase()).not.toContain('youtube');
  });

  it('POS-PRIV-2: o Is Agentic entrou na lista de terceiros', () => {
    const privacy = readFileSync(root('src/content/privacy.ts'), 'utf-8').toLowerCase();
    expect(privacy).toContain('is-agentic');
  });
});
