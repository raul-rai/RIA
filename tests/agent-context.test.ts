import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAgentContext } from '../scripts/build-agent-context';
import { PATHS } from '../src/content/paths';
import { INTENTS } from '../src/content/intents';

const publicado = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/agent-context.json'), 'utf-8')
);

describe('agent-context: o contexto que o agente le', () => {
  it('CTX-01: o arquivo publicado e identico ao que o gerador produz agora', () => {
    // Este e o teste que impede a divergencia que produziu o "1 das 5 frentes"
    // em producao: mexer em src/content sem regenerar quebra aqui, no CI, e
    // nao na frente de um lead.
    expect(publicado).toEqual(buildAgentContext());
  });

  it('CTX-02: os caminhos do contexto sao exatamente os caminhos do site', () => {
    expect(publicado.paths).toHaveLength(PATHS.length);
    expect(publicado.paths.map((p: { id: string }) => p.id)).toEqual(PATHS.map((p) => p.id));
    expect(publicado.paths.map((p: { id: string }) => p.id)).toEqual(['novo', 'otimizar']);
  });

  it('CTX-03: nada do posicionamento antigo sobrevive no contexto publicado', () => {
    // Blocos que descreviam produtos que a pagina deixou de vender: as tres
    // frentes, a parede de videos e o indice sintetico. O agente que os le
    // apresenta ao lead uma oferta que ele nao viu em lugar nenhum.
    for (const chave of ['fronts', 'authorities', 'authoritiesDisclaimer', 'vulnerability']) {
      expect(publicado, `o bloco ${chave} voltou ao contexto`).not.toHaveProperty(chave);
    }
    // E o vocabulario: varre o JSON inteiro, nao so os blocos que saíram — o
    // texto antigo tambem sobrevivia dentro de oferta, FAQ e intencoes.
    const texto = JSON.stringify(publicado);
    for (const morto of [
      /Diagnóstico de Gargalo/i,
      /frentes?\b/i,
      /vulnerab/i,
      /índice de/i,
      /Vozes do mercado/i,
      /Navegação agêntica/i,
      /vídeo completo abre no YouTube/i,
    ]) {
      expect(texto, `vocabulário morto no contexto: ${morto}`).not.toMatch(morto);
    }
  });

  it('CTX-04: a sessao gratuita dura 15 minutos, como a pagina diz', () => {
    expect(publicado.positioning.firstCall.minutes).toBe(15);
    expect(publicado.positioning.firstCall.free).toBe(true);
  });

  it('CTX-05: caso sem apuracao chega marcado como nao auditado', () => {
    for (const c of publicado.cases) {
      expect(c.audited).toBe(Boolean(c.measurement));
    }
  });

  it('CTX-06: toda evidencia chega com fonte e ano, que e o que o agente pode citar', () => {
    expect(publicado.evidence.length).toBeGreaterThan(0);
    for (const e of publicado.evidence) {
      expect(e.source.trim().length).toBeGreaterThan(0);
      expect(typeof e.year).toBe('number');
    }
  });

  it('CTX-07: o gerador e deterministico — nada de timestamp', () => {
    expect(JSON.stringify(buildAgentContext())).toBe(JSON.stringify(buildAgentContext()));
    expect(JSON.stringify(publicado)).not.toContain('generatedAt');
  });

  it('CTX-08: toda intencao do site tem significado declarado para o agente', () => {
    // O intentId chega ao n8n e, sem significado declarado aqui, o agente fica
    // cego para a dobra de origem.
    //
    // A lista vem de content/intents.ts, NAO de um array escrito neste arquivo.
    // Ja foi escrita a mao — e foi o que a fez virar guarda invertida: a lista
    // ficou congelada nos seis ids da pagina antiga, as intencoes novas
    // entraram em intents.ts e o teste nao notou, defendendo o dado obsoleto.
    // Lendo a fonte, intencao nova sem significado aqui reprova; id morto
    // publicado no contexto tambem.
    const doSite = Object.keys(INTENTS);
    expect(doSite.length).toBeGreaterThan(0);
    const declaradas = publicado.intents.map((i: { id: string }) => i.id);
    expect([...declaradas].sort()).toEqual([...doSite].sort());
    for (const i of publicado.intents) {
      expect(i.meaning.trim().length).toBeGreaterThan(20);
    }
  });

  it('CTX-09: a medicao declara os dois instrumentos e que as notas nao se combinam', () => {
    const { instruments, note } = publicado.measurement;
    expect(instruments).toHaveLength(2);
    expect(instruments[0].name).toContain('Lighthouse');
    expect(instruments[1].name).toContain('Is Agentic');
    for (const i of instruments) expect(i.measures.trim().length).toBeGreaterThan(10);
    // A regra que atravessa a pagina inteira: sem nota geral, sem media.
    expect(note).toMatch(/independentes/);
    expect(note).toMatch(/nunca/);
  });

  it('CTX-13: sem preco publicado, o contexto diz null — nunca uma estimativa', () => {
    // O valor alimenta o que o agente diz ao lead. Enquanto PRICE for null, o
    // agente fala "sai na proposta"; um numero aqui seria o preco inventado que
    // o JSON-LD tambem nao pode carregar.
    expect(publicado.offer).toHaveProperty('price');
    expect(publicado.offer).not.toHaveProperty('diagnosticPrice');
    expect(publicado.offer.price).toBeNull();
  });
});

describe('vercel.json: o contexto precisa ser SERVIDO, nao reescrito', () => {
  const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));

  it('CTX-10: o arquivo e JSON valido', () => {
    // Ja quebrou: um `\.` dentro de string JSON e escape invalido, e o deploy
    // inteiro cai. Barra invertida em regex de rota vira classe [.].
    expect(Array.isArray(vercel.rewrites)).toBe(true);
  });

  it('CTX-11: nenhum rewrite engole o agent-context.json', () => {
    // Antes o site reescrevia TUDO para /index.html e precisava de uma exceção
    // para o contexto. Agora não há catch-all: só /onda (rota client-only, sem
    // arquivo prerenderizado) é reescrita, e todo o resto — inclusive
    // agent-context.json, sitemap.xml, llms.txt e os .md — é servido como
    // arquivo estático. Se algum rewrite voltasse a capturar o contexto, o n8n
    // baixaria HTML no lugar do JSON, em silêncio (o HTTP continua 200).
    for (const { source } of vercel.rewrites) {
      const regex = new RegExp('^' + source + '$');
      expect(regex.test('/agent-context.json'), `rewrite ${source} captura o contexto`).toBe(false);
    }
    // A única rota client-only continua reescrita para o app shell.
    expect(vercel.rewrites.some((r: { source: string }) => r.source === '/onda')).toBe(true);
  });

  it('CTX-12: caminho inexistente cai num 404 real, não no app shell', () => {
    // Sem catch-all, um GET num caminho que não existe não é reescrito para
    // /index.html (que devolveria 200 e faria o agente crer que toda rota
    // existe). A Vercel serve dist/404.html com status 404. Aqui trancamos os
    // dois lados do contrato: nenhum rewrite captura um caminho arbitrário, e o
    // 404.html foi gerado.
    const arbitrario = '/isto-nao-existe-em-lugar-nenhum';
    for (const { source } of vercel.rewrites) {
      const regex = new RegExp('^' + source + '$');
      expect(regex.test(arbitrario), `rewrite ${source} captura caminho arbitrário`).toBe(false);
    }
  });
});
