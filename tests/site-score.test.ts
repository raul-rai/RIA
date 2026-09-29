import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import {
  derivePath,
  hasAnyMeasurement,
  deriveChosenOnNoWebsite,
  scoreReducer,
  INITIAL_SITE_SCORE,
  type SiteScoreAction,
  type SiteScoreData,
} from '../src/context/SiteScoreContext';
import type { GoogleReport } from '../src/lib/lighthouse-report';
import type { AgenticReport } from '../src/lib/agentic-report';

const root = (p: string) => resolve(process.cwd(), p);

function sourceFiles(dir = root('src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe('SS: estado das duas notas', () => {
  it('SS-01: sem nenhuma medição, não há caminho sugerido', () => {
    expect(derivePath({ hasNoWebsite: false, googleScore: null })).toBeNull();
  });

  it('SS-02: declarar que não tem site sugere criar', () => {
    expect(derivePath({ hasNoWebsite: true, googleScore: null })).toBe('novo');
  });

  it('SS-03: medição feita conta como medida', () => {
    expect(hasAnyMeasurement({ google: null, agentic: null, hasNoWebsite: false })).toBe(false);
    expect(hasAnyMeasurement({ google: null, agentic: null, hasNoWebsite: true })).toBe(true);
    expect(hasAnyMeasurement({ google: { score: 50 }, agentic: null, hasNoWebsite: false })).toBe(true);
    expect(hasAnyMeasurement({ google: null, agentic: { score: 72 }, hasNoWebsite: false })).toBe(true);
  });

  it('SS-05: setNoWebsite(true) descarta a escolha anterior', () => {
    expect(deriveChosenOnNoWebsite(true)).toBeNull();
  });

  it('SS-06: setNoWebsite(false) não altera a escolha anterior', () => {
    expect(deriveChosenOnNoWebsite(false)).toBeUndefined();
  });
});

describe('SS: as duas notas nunca se misturam', () => {
  it('SS-04: nenhum arquivo de src/ combina googleScore com agenticScore numa conta', () => {
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      const texto = readFileSync(file, 'utf-8').replace(/(?<![*\w'"])\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      // Soma, média ou ponderação entre as duas notas, em qualquer ordem.
      if (/(google\w*Score|google\.score)[^;\n]{0,40}[+*/][^;\n]{0,40}(agentic\w*Score|agentic\.score)/i.test(texto)
        || /(agentic\w*Score|agentic\.score)[^;\n]{0,40}[+*/][^;\n]{0,40}(google\w*Score|google\.score)/i.test(texto)) {
        infratores.push(file.replace(root('.'), '.'));
      }
    }
    expect(infratores, `combinam as duas notas:\n${infratores.join('\n')}`).toEqual([]);
  });

});

describe('SS: o índice de vulnerabilidade saiu de vez', () => {
  it('SS-07: nenhum código de src/ usa o contexto, o provedor ou o campo do índice extinto', () => {
    // Só código: comentários históricos ("o índice de vulnerabilidade que isto
    // substitui") continuam livres para contar o que mudou. O que não pode
    // voltar é o uso — um import, um hook, um campo de payload.
    const infratores: string[] = [];
    for (const file of sourceFiles()) {
      const texto = readFileSync(file, 'utf-8').replace(/(?<![*\w'"])\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      if (/useVulnerability|VulnerabilityProvider|VulnerabilityContext|vulnerabilityIndex/.test(texto)) {
        infratores.push(file.replace(root('.'), '.'));
      }
    }
    expect(infratores, `ainda usam o índice extinto:\n${infratores.join('\n')}`).toEqual([]);
  });

  it('SS-08: os arquivos do índice e das redes sociais não existem mais', () => {
    for (const morto of [
      'src/context/VulnerabilityContext.tsx',
      'src/constants/socialNetworks.ts',
      'src/components/FrontsSection.tsx',
      'src/components/PotentialDiagnostic.tsx',
      'src/lib/agentic-readiness.ts',
    ]) {
      expect(existsSync(root(morto)), `${morto} voltou`).toBe(false);
    }
  });
});

const semComentarios = (texto: string) =>
  texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const rodar = (acoes: SiteScoreAction[], inicial: SiteScoreData = INITIAL_SITE_SCORE) =>
  acoes.reduce(scoreReducer, inicial);

const URL_MEDIDA = 'https://exemplo.com.br/';
const notaGoogle = { score: 41 } as unknown as GoogleReport;
const notaAgentica = { score: 66 } as unknown as AgenticReport;

/**
 * A SEQUÊNCIA, não as funções soltas.
 *
 * derivePath, hasAnyMeasurement e deriveChosenOnNoWebsite estavam cobertas como
 * funções puras e o defeito passou: "Ainda não tenho site" -> digitar a URL ->
 * medir deixava hasNoWebsite preso em true ao lado de um target medido. Estes
 * testes exercitam a transição de estado inteira.
 */
describe('SS: as transições do estado (redutor)', () => {
  it('SS-08: declarar "sem site" limpa notas e alvo e descarta a escolha', () => {
    const medido = rodar([
      { type: 'setTarget', target: URL_MEDIDA },
      { type: 'setGoogle', report: notaGoogle },
      { type: 'setAgentic', report: notaAgentica },
      { type: 'choosePath', path: 'otimizar' },
    ]);
    const declarado = rodar([{ type: 'setNoWebsite', value: true }], medido);
    expect(declarado).toEqual({ ...INITIAL_SITE_SCORE, hasNoWebsite: true });
  });

  it('SS-09: nota que chega prova que há site e desfaz a declaração', () => {
    const declarado = rodar([{ type: 'setNoWebsite', value: true }]);
    expect(rodar([{ type: 'setGoogle', report: notaGoogle }], declarado).hasNoWebsite).toBe(false);
    expect(rodar([{ type: 'setAgentic', report: notaAgentica }], declarado).hasNoWebsite).toBe(false);
    // Já limpar uma nota (null) não prova nada: a declaração fica.
    expect(rodar([{ type: 'setGoogle', report: null }], declarado).hasNoWebsite).toBe(true);
  });

  it('SS-10: setNoWebsite(false) só desliga a declaração e não mexe em mais nada', () => {
    const antes = rodar([
      { type: 'setTarget', target: URL_MEDIDA },
      { type: 'choosePath', path: 'otimizar' },
    ]);
    expect(rodar([{ type: 'setNoWebsite', value: false }], antes)).toEqual(antes);
  });

  it('SS-11: reset volta ao estado inicial', () => {
    const sujo = rodar([
      { type: 'setNoWebsite', value: true },
      { type: 'choosePath', path: 'novo' },
    ]);
    expect(rodar([{ type: 'reset' }], sujo)).toEqual(INITIAL_SITE_SCORE);
  });
});

describe('SS: "Ainda não tenho site" -> medir uma URL -> a medição falha', () => {
  const hook = readFileSync(root('src/hooks/useSiteScan.tsx'), 'utf-8');

  /**
   * As ações que start() dispara sobre o estado das notas, NA ORDEM em que
   * aparecem no código, lidas da fonte. O teste reexecuta essa mesma sequência
   * no redutor: se alguém tirar o setNoWebsite(false) de start(), a declaração
   * sobrevive à medição aqui, como sobrevivia na tela.
   */
  function acoesDoStart(): SiteScoreAction[] {
    const corpo = semComentarios(hook);
    const inicio = corpo.indexOf('const start = useCallback(');
    const fim = corpo.indexOf("track('scan_started')", inicio);
    expect(inicio, 'start() não achado').toBeGreaterThan(-1);
    expect(fim, "track('scan_started') não achado em start()").toBeGreaterThan(inicio);
    const trecho = corpo.slice(inicio, fim);

    const acoes: SiteScoreAction[] = [];
    for (const [, nome, arg] of trecho.matchAll(/\b(setGoogle|setAgentic|setNoWebsite|setTarget)\(([^)]*)\)/g)) {
      if (nome === 'setGoogle') acoes.push({ type: 'setGoogle', report: null });
      else if (nome === 'setAgentic') acoes.push({ type: 'setAgentic', report: null });
      else if (nome === 'setNoWebsite') acoes.push({ type: 'setNoWebsite', value: arg.trim() === 'true' });
      else acoes.push({ type: 'setTarget', target: URL_MEDIDA });
    }
    return acoes;
  }

  it('SS-12: start() declara setNoWebsite(false) junto de setTarget(target)', () => {
    const acoes = acoesDoStart();
    const iNoSite = acoes.findIndex((a) => a.type === 'setNoWebsite');
    const iAlvo = acoes.findIndex((a) => a.type === 'setTarget');
    expect(iNoSite, 'start() não retrata a declaração').toBeGreaterThan(-1);
    expect(iAlvo).toBeGreaterThan(-1);
    expect(acoes[iNoSite]).toEqual({ type: 'setNoWebsite', value: false });
    expect(Math.abs(iNoSite - iAlvo), 'devem ser vizinhas').toBe(1);
  });

  it('SS-13: a declaração não sobrevive à medição, mesmo se as duas medições falham', () => {
    const declarado = rodar([{ type: 'setNoWebsite', value: true }]);
    expect(declarado.hasNoWebsite).toBe(true);

    // start(url) ... e nenhuma nota chega depois: as duas medições falharam.
    const depois = rodar(acoesDoStart(), declarado);

    expect(depois.hasNoWebsite, 'o agente abriria com a saudação de quem não tem site').toBe(false);
    expect(depois.target).toBe(URL_MEDIDA);
    expect(depois.google).toBeNull();
    expect(depois.agentic).toBeNull();
    // Sem nota e sem declaração: nenhum caminho é sugerido, e nada foi medido.
    expect(derivePath({ hasNoWebsite: depois.hasNoWebsite, googleScore: null })).toBeNull();
    expect(hasAnyMeasurement(depois)).toBe(false);
  });

  it('SS-14: a escolha de caminho do visitante é preservada pela medição', () => {
    const escolheu = rodar([{ type: 'choosePath', path: 'otimizar' }]);
    const depois = rodar(acoesDoStart(), escolheu);
    expect(depois.chosen).toBe('otimizar');

    // E quem declarou "sem site" (escolha descartada) não ganha uma escolha do nada.
    const declarou = rodar([
      { type: 'choosePath', path: 'otimizar' },
      { type: 'setNoWebsite', value: true },
    ]);
    expect(rodar(acoesDoStart(), declarou).chosen).toBeNull();
  });
});
