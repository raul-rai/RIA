import { describe, it, expect } from 'vitest';
import { PROOF_PANELS } from '../src/content/proofPanels';

describe('PROOF_PANELS: paineis de apoio da parede', () => {
  it('PANEL-01: existe pelo menos um painel de apoio', () => {
    expect(PROOF_PANELS.length).toBeGreaterThan(0);
  });

  it('PANEL-02: todo painel tem conteudo textual nao vazio', () => {
    for (const p of PROOF_PANELS) {
      const text = p.kind === 'metric' ? `${p.value}${p.label}` : `${p.name}${p.note}`;
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
