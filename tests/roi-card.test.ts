import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseRoiData } from '../src/components/AIChatAgent';

const root = (p: string) => resolve(process.cwd(), p);
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * O cartão de ROI do agente.
 *
 * O `roi` é saída de um modelo de linguagem. Duas regras: ausência nunca vira
 * "R$ 0 /ano" (Number(null) === 0 passa em Number.isFinite), e o cartão nunca se
 * chama "detecção" — é estimativa do agente, e a tela diz a base dela.
 */
describe('ROI: parseRoiData não fabrica número', () => {
  it('ROI-01: número válido produz o cartão', () => {
    expect(parseRoiData({ roi: 48000 })).toEqual({
      roi: 48000,
      name: undefined,
      revenue: undefined,
      efficiency: undefined,
    });
    expect(parseRoiData({ roi: 12.5, name: 'Loja', revenue: 100, efficiency: 0.3 })).toEqual({
      roi: 12.5,
      name: 'Loja',
      revenue: 100,
      efficiency: 0.3,
    });
  });

  it('ROI-02: um zero que o modelo de fato mandou continua sendo número', () => {
    // Zero enviado como número é dado; o que não pode é zero VINDO de coerção.
    expect(parseRoiData({ roi: 0 })?.roi).toBe(0);
  });

  it.each([
    ['null', null],
    ["'' (string vazia)", ''],
    ['false', false],
    ['[] (array vazio)', []],
    ['ausente', undefined],
    ['string numérica', '48000'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['objeto', {}],
  ])('ROI-03: roi %s não produz cartão', (_nome, valor) => {
    expect(parseRoiData({ roi: valor })).toBeUndefined();
  });

  it('ROI-04: payload sem o campo roi, ou que nem é objeto, não produz cartão', () => {
    expect(parseRoiData({})).toBeUndefined();
    expect(parseRoiData({ name: 'Loja', revenue: 10 })).toBeUndefined();
    expect(parseRoiData(null)).toBeUndefined();
    expect(parseRoiData(undefined)).toBeUndefined();
    expect(parseRoiData('48000')).toBeUndefined();
    expect(parseRoiData(48000)).toBeUndefined();
  });

  it('ROI-05: revenue e efficiency ausentes ou coagíveis não viram 0', () => {
    for (const ruim of [null, '', false, [], undefined, '10']) {
      const cartao = parseRoiData({ roi: 1, revenue: ruim, efficiency: ruim });
      expect(cartao?.revenue, `revenue ${JSON.stringify(ruim)}`).toBeUndefined();
      expect(cartao?.efficiency, `efficiency ${JSON.stringify(ruim)}`).toBeUndefined();
    }
  });
});

describe('ROI: o cartão não chama estimativa de medição', () => {
  const fonte = readFileSync(root('src/components/AIChatAgent.tsx'), 'utf-8');
  const codigo = semComentarios(fonte);

  it('ROI-06: nenhum texto visível do agente diz "Detectado"', () => {
    expect(codigo).not.toMatch(/detectad[oa]/i);
  });

  it('ROI-07: o cartão se declara estimativa do agente e diz a base do número', () => {
    const cartao = codigo.slice(codigo.indexOf('msg.data &&'), codigo.indexOf('msg.handoff &&'));
    expect(cartao).toContain('Estimativa do agente');
    // A base: o que o visitante contou, e o que o número NÃO é.
    expect(cartao).toMatch(/a partir do que você contou/);
    expect(cartao).toMatch(/Não é uma\s+medição/);
  });

  it('ROI-08: o parser não coage — sem Number( no arquivo do agente', () => {
    expect(codigo).not.toMatch(/\bNumber\(/);
    expect(codigo).toMatch(/import \{ numero \} from '..\/lib\/agentic-report'/);
  });
});
