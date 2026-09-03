// Paineis de apoio que enchem a parede de videos 3d, junto dos 3 videos de
// autoridade. NAO sao vozes novas: sao ancoras de contexto (veiculos onde essas
// vozes aparecem e metricas de mercado). Mantenha curto — cada painel e um card
// pequeno na parede.
//
// PLACEHOLDER: os textos abaixo saem das bios ja citadas em content/authorities.ts.
// Revise antes de publicar; se um dado nao puder ser sustentado, troque ou remova.
export type ProofPanel =
  | { kind: 'metric'; value: string; label: string }
  | { kind: 'outlet'; name: string; note: string };

export const PROOF_PANELS: ProofPanel[] = [
  { kind: 'outlet', name: 'Forbes', note: 'Economista mais influente do Brasil' },
  { kind: 'outlet', name: 'LinkedIn', note: 'Top Voice em negócios e tecnologia' },
  { kind: 'metric', value: '+20 anos', label: 'no mercado financeiro global' },
  { kind: 'metric', value: 'CESAR', label: 'referência em engenharia de software' },
];
