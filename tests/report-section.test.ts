import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = (p: string) => resolve(process.cwd(), p);
// Normaliza CRLF: os cartoes chegam com \r\n e os regex abaixo miram \n.
const ler = (p: string) => readFileSync(root(p), 'utf-8').replace(/\r\n/g, '\n');
const semComentarios = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const secao = ler('src/components/ReportSection.tsx');
const google = ler('src/components/GoogleReportCard.tsx');
const agentic = ler('src/components/AgenticReportCard.tsx');

/** Texto de `function nome(...) { ... }` de primeiro nivel (fecha na primeira `\n}`). */
function funcao(fonte: string, nome: string): string {
  const m = semComentarios(fonte).match(new RegExp(`function ${nome}\\([\\s\\S]*?\\n\\}`));
  if (!m) throw new Error(`função ${nome} não encontrada`);
  return m[0];
}

/**
 * Roda a funcao de verdade: tira as anotacoes de tipo (so as que estas funcoes
 * pequenas usam) e avalia. Teste de comportamento sem DOM e sem transpilador.
 */
function executar(fonte: string, nome: string): (...args: unknown[]) => unknown {
  const codigo = funcao(fonte, nome)
    .replace(/\)\s*:\s*[^{]+\{/, ') {')
    .replace(/(\w+)\s*:\s*[\w<>|[\] ]+?(?=\s*[,)])/g, '$1');
  return new Function(`${codigo}; return ${nome};`)();
}

/** O ramo `!report ? ( ... ) : (` do cartao: o que a tela imprime sem medicao. */
function ramoNaoMedido(fonte: string): string {
  const corpo = semComentarios(fonte);
  const ini = corpo.indexOf('!report ? (');
  const fim = corpo.indexOf(') : (', ini);
  if (ini < 0 || fim < 0) throw new Error('ramo "não medido" não encontrado');
  return corpo.slice(ini, fim);
}

describe('LAUDO: duas notas, dois instrumentos', () => {
  it('LAU-01: a seção monta as duas colunas', () => {
    expect(secao).toContain('<GoogleReportCard');
    expect(secao).toContain('<AgenticReportCard');
  });

  it('LAU-02: cada coluna nomeia a sua fonte', () => {
    expect(google).toMatch(/Google Lighthouse/);
    expect(agentic).toMatch(/Is Agentic/);
    expect(agentic).toMatch(/Vercel Labs/);
  });

  it('LAU-03: a coluna agêntica publica o link de conferência, e só o link seguro', () => {
    const corpo = semComentarios(agentic);
    // O href vem do resultado de linkSeguro, nunca de report.reportUrl cru.
    expect(corpo, 'laudo precisa sair de linkSeguro(report.reportUrl)').toMatch(
      /laudo\s*=\s*report\s*\?\s*linkSeguro\(report\.reportUrl\)\s*:\s*null/,
    );
    expect(corpo, 'href cru de terceiro').not.toMatch(/href=\{\s*report\.reportUrl\s*\}/);

    const ancora = corpo.match(/<a\b[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(ancora, 'o bloco <a> do laudo público sumiu').not.toBe('');
    expect(ancora).toContain('href={laudo}');
    expect(ancora).toContain('target="_blank"');
    expect(ancora).toContain('rel="noopener noreferrer"');
    expect(ancora).toContain('Conferir o laudo completo no Is Agentic');

    // Sem link válido, a tela diz "não medido" em vez de deixar um <a> quebrado.
    expect(corpo).toMatch(
      /laudo\s*\?\s*\(\s*<a\b[\s\S]*?<\/a>\s*\)\s*:\s*\(\s*<p[^>]*>\s*Link do laudo público: não medido/,
    );
  });

  it('LAU-04: a coluna agêntica separa essencial de recomendado', () => {
    expect(agentic).toContain('issuesByTier');
    expect(agentic).toMatch(/'essential'/);
    expect(agentic).toMatch(/'recommended'/);
  });

  it('LAU-05: a coluna agêntica mostra a evidência, não só o nome do problema', () => {
    expect(agentic).toMatch(/\.details/);
  });

  it('LAU-06: nenhuma das três combina as duas notas', () => {
    const s = semComentarios(secao);
    const g = semComentarios(google);
    const a = semComentarios(agentic);

    expect(s + g + a).not.toMatch(/média|media geral|notaGeral|combinedScore/i);

    // A seção monta as colunas e não lê nota nenhuma: qualquer `.score` aqui é
    // conta entre as duas, por exemplo (google.score + agentic.score) / 2.
    expect(s, 'a seção não pode ler .score').not.toMatch(/\.score\b/);

    // Cada cartão só toca a própria nota (e o vital `v`, que é do próprio Google),
    // e só para exibir ou colorir.
    for (const [nome, fonte] of [['google', g], ['agentic', a]] as const) {
      const usos = fonte.match(/[\w.?]*\.score\b/g) ?? [];
      for (const uso of new Set(usos)) {
        expect(['report.score', 'v.score'], `${nome}: ${uso} fora de report.score`).toContain(uso);
      }
      const puros =
        (fonte.match(/\{report\.score\}/g) ?? []).length +
        (fonte.match(/toneOf\((report|v)\.score\)/g) ?? []).length;
      expect(usos.length, `${nome}: .score entrou numa conta`).toBe(puros);
    }

    // Um cartão que nem enxerga o outro instrumento não tem como combiná-los.
    expect(g, 'google enxerga o agêntico').not.toMatch(/agentic/i);
    expect(a, 'agêntico enxerga o Google').not.toMatch(/google|lighthouse/i);
    expect(s.match(/<GoogleReportCard[^>]*\/>/)?.[0] ?? '').not.toMatch(/agentic/i);
    expect(s.match(/<AgenticReportCard[^>]*\/>/)?.[0] ?? '').not.toMatch(/google/i);
  });

  it('LAU-07: ausência de medição imprime texto, nunca zero', () => {
    for (const [nome, fonte] of [['google', google], ['agentic', agentic]] as const) {
      const corpo = semComentarios(fonte);
      expect(corpo, `${nome}: score literal zero`).not.toMatch(/score\s*[=:]\s*0\b/);
      expect(corpo, `${nome}: fallback para zero`).not.toMatch(/(\?\?|\|\|)\s*0\b/);
      expect(corpo).toMatch(/não medido/);

      // O que a tela imprime quando não há laudo: texto, sem "/100" e sem número.
      const ramo = ramoNaoMedido(fonte)
        .replace(/aria-valuemax=\{100\}/g, '')
        .replace(/aria-valuemin=\{0\}/g, '');
      expect(ramo, `${nome}: o ramo sem laudo perdeu o "não medido"`).toMatch(/não medido/);
      expect(ramo, `${nome}: "/100" no ramo sem laudo`).not.toMatch(/\/100/);
      expect(ramo, `${nome}: nota no ramo sem laudo`).not.toMatch(/score/);
      expect(ramo, `${nome}: ternário numérico no ramo sem laudo`).not.toMatch(/\?\s*-?\d+\s*:\s*-?\d+/);
      expect(ramo, `${nome}: zero impresso no ramo sem laudo`).not.toMatch(/\{\s*0\s*\}|>\s*0\s*</);
    }
  });

  it('LAU-08: a quinta dimensão não sobreviveu', () => {
    expect(google).not.toMatch(/Navegação agêntica|D5/);
  });

  it('LAU-09: a tela nega a nota geral, sempre que as duas colunas aparecem', () => {
    const corpo = semComentarios(secao);
    expect(corpo).toMatch(/Não existe nota geral: cada instrumento mede uma coisa diferente/);

    // Fora do `{target && (...)}`: o cabeçalho depende do alvo, a negação não.
    const iniAlvo = corpo.indexOf('{target && (');
    const fimAlvo = corpo.indexOf('\n      )}', iniAlvo);
    expect(iniAlvo).toBeGreaterThan(-1);
    expect(fimAlvo).toBeGreaterThan(iniAlvo);
    const pos = corpo.indexOf('Não existe nota geral');
    expect(pos > fimAlvo || pos < iniAlvo, 'a negação está presa ao cabeçalho do alvo').toBe(true);

    // E vem antes dos números: o leitor lê a negação antes de ver os dois "/100".
    expect(pos).toBeLessThan(corpo.indexOf('<GoogleReportCard'));
  });

  it('LAU-10: balde sem medição imprime "não medido", nunca "null de null" nem zero', () => {
    const checagens = executar(agentic, 'checagens');
    const b = (passing: number | null, total: number | null) => ({
      earned: null,
      available: null,
      passing,
      total,
    });

    expect(checagens(b(3, 7), 'checagens essenciais')).toBe('3 de 7 checagens essenciais passaram');
    // Zero medido de verdade continua sendo zero.
    expect(checagens(b(0, 7), 'checagens essenciais')).toBe('0 de 7 checagens essenciais passaram');
    // Cada campo ausente derruba a frase, sozinho.
    expect(checagens(b(null, null), 'checagens essenciais')).toBe('checagens essenciais: não medido');
    expect(checagens(b(null, 7), 'checagens essenciais')).toBe('checagens essenciais: não medido');
    expect(checagens(b(3, null), 'checagens recomendadas')).toBe('checagens recomendadas: não medido');

    // Os dois baldes passam por checagens(); ninguém interpola o campo cru.
    const corpo = semComentarios(agentic);
    expect(corpo).toContain("checagens(report.essential, 'checagens essenciais')");
    expect(corpo).toContain("checagens(report.recommended, 'checagens recomendadas')");
    const fora = corpo.replace(funcao(agentic, 'checagens'), '');
    expect(fora, 'campo do balde lido fora de checagens()').not.toMatch(/\.(passing|total|earned|available)\b/);
  });

  it('LAU-11: Core Web Vitals confere o tamanho da lista e admite "não medido"', () => {
    const corpo = semComentarios(google);
    const teste = corpo.indexOf('report.webVitals.length > 0');
    const grade = corpo.indexOf('report.webVitals.map');
    const vazio = corpo.indexOf('Core Web Vitals: não medido');
    expect(teste, 'a grade não confere .length > 0').toBeGreaterThan(-1);
    expect(grade).toBeGreaterThan(teste);
    // O texto de ausência vem depois da grade: é o ramo "senão" do mesmo ternário.
    expect(vazio).toBeGreaterThan(grade);
    expect(corpo).toMatch(
      /report\.webVitals\.length > 0 \? \(\s*<ul[\s\S]*?\) : \(\s*<p[^>]*>\s*<strong[^>]*>Core Web Vitals: não medido/,
    );
  });

  it('LAU-12: linkSeguro só aceita http(s), venha o que vier da API de terceiro', () => {
    const linkSeguro = executar(agentic, 'linkSeguro');
    expect(linkSeguro('https://isagentic.dev/r/abc')).toBe('https://isagentic.dev/r/abc');
    expect(linkSeguro('http://isagentic.dev/r/abc')).toBe('http://isagentic.dev/r/abc');
    expect(linkSeguro('HTTPS://ISAGENTIC.DEV/R')).toBe('HTTPS://ISAGENTIC.DEV/R');
    expect(linkSeguro('javascript:alert(1)')).toBeNull();
    expect(linkSeguro('data:text/html,<script>1</script>')).toBeNull();
    expect(linkSeguro('//isagentic.dev/r')).toBeNull();
    expect(linkSeguro('isagentic.dev/r')).toBeNull();
    expect(linkSeguro('')).toBeNull();
  });

  it('LAU-13: "endereço inválido" não acusa o Google nem o Is Agentic', () => {
    const motivo = (fonte: string) =>
      semComentarios(fonte).match(/'invalid-url':\s*'([^']*)'/)?.[1] ?? '';

    const g = motivo(google);
    expect(g, 'texto de invalid-url do Google sumiu').not.toBe('');
    expect(g).toMatch(/endereço digitado não parece completo/);
    expect(g).toMatch(/nem chegou a ser consultado/);
    expect(g, 'acusa o Google de falhar').not.toMatch(/não devolveu|estour|falhou|indispon|fora do ar/i);

    const a = motivo(agentic);
    expect(a, 'texto de invalid-url do Is Agentic sumiu').not.toBe('');
    expect(a).toMatch(/endereço não parece completo/);
    expect(a, 'acusa o Is Agentic de falhar').not.toMatch(/não completou|fila|falhou|indispon|fora do ar/i);
  });

  it('LAU-14: laudo sem apontamentos não afirma que está tudo certo', () => {
    const corpo = semComentarios(agentic);
    expect(corpo).toMatch(
      /report\.issues\.length === 0 && \(\s*<p[^>]*>\s*Nenhum apontamento listado nesta varredura\./,
    );
    // O parser descarta apontamento malformado: lista vazia não prova ausência de falha.
    const frase = corpo.match(/Nenhum apontamento[^<]*/)?.[0] ?? '';
    expect(frase).not.toMatch(/problema|falha|tudo certo|aprovad|passou em tudo|perfeit/i);
    // O bloco vazio não imprime título solto.
    expect(funcao(agentic, 'Bloco')).toMatch(/if \(itens\.length === 0\) return null;/);
  });
});
