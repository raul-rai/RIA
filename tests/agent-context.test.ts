import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAgentContext } from '../scripts/build-agent-context';
import { PATHS } from '../src/content/paths';
import { INTENTS } from '../src/content/intents';
import { EVIDENCE } from '../src/content/evidence';
import { CASES } from '../src/content/cases';

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

/**
 * O que é histórico chega marcado como histórico.
 *
 * O agent-context.json é lido por agentes de IA como descrição verdadeira e
 * ATUAL da empresa, e três blocos ainda falavam do produto que saiu: as
 * evidências do MIT e da HBR (takeaways de "processo errado para automatizar" e
 * de SDR), os casos de agente SDR e de automação do atendimento, e a bio ("onde
 * está o gargalo"). O CTX-03 só procurava cinco expressões e não pegava isso.
 *
 * A decisão foi MARCAR, não filtrar (ver o cabeçalho de
 * scripts/build-agent-context.ts): a página continua mostrando os três casos e
 * as quatro fontes, então filtrar do contexto recriaria a assimetria entre
 * robô e comprador, ao contrário. Estes testes travam a decisão.
 */
describe('agent-context: o histórico chega marcado, e nada some', () => {
  const RELACOES = ['oferta-atual', 'parcial', 'historico'];

  const porFonte = (fonte: string) => publicado.evidence.find((e: any) => e.source.startsWith(fonte));
  const porSegmento = (seg: string) => publicado.cases.find((c: any) => c.segment === seg);

  it('CTX-14: nenhuma evidência e nenhum caso saiu do contexto — só ganharam marca', () => {
    // Filtrar seria a saída fácil e a errada: prova real de cliente não sai da
    // página por mudança de posicionamento, e a página segue mostrando tudo.
    expect(publicado.evidence.map((e: any) => e.source)).toEqual(EVIDENCE.map((e) => e.source));
    expect(publicado.cases.map((c: any) => c.segment)).toEqual(CASES.map((c) => c.segment));

    // E o dado em si segue íntegro: número, fonte, ano, link; título e trajeto do caso.
    publicado.evidence.forEach((e: any, i: number) => {
      expect(e.value).toBe(EVIDENCE[i].value);
      expect(e.claim).toBe(EVIDENCE[i].claim);
      expect(e.year).toBe(EVIDENCE[i].year);
      expect(e.method).toBe(EVIDENCE[i].method);
      expect(e.url).toBe(EVIDENCE[i].url);
    });
    publicado.cases.forEach((c: any, i: number) => {
      expect(c.headline).toBe(CASES[i].headline);
      expect(c.before).toBe(CASES[i].before);
      expect(c.intervention).toBe(CASES[i].intervention);
      expect(c.timeframe).toBe(CASES[i].timeframe);
    });
  });

  it('CTX-15: toda prova diz o que sustenta, e o que não é oferta atual explica por quê', () => {
    for (const item of [...publicado.evidence, ...publicado.cases]) {
      const nome = item.source ?? item.segment;
      expect(RELACOES, `"${nome}" sem offerRelation válido`).toContain(item.offerRelation);
      if (item.offerRelation === 'oferta-atual') {
        expect(item.note, `"${nome}" é oferta atual e não precisa de nota`).toBeNull();
      } else {
        expect(
          (item.note ?? '').trim().length,
          `"${nome}" não é oferta atual e chegou sem nota explicando`
        ).toBeGreaterThan(60);
      }
    }
  });

  it('CTX-16: a classificação está travada — MIT, HBR e o caso SDR são históricos', () => {
    // Os dois estudos que sustentavam a oferta anterior. A leitura de cada um
    // ("processo errado para automatizar", "lead na primeira hora") era a ponte
    // para essa oferta e não chega ao agente; o número, a fonte e o link chegam.
    for (const fonte of ['MIT', 'Harvard']) {
      const e = porFonte(fonte);
      expect(e.offerRelation, `${fonte} deixou de ser histórico`).toBe('historico');
      expect(e.takeaway, `${fonte}: o takeaway da oferta anterior voltou ao contexto`).toBeNull();
      expect(e.note).toMatch(/oferta anterior/);
      expect(e.note).toMatch(/não sustenta o que a RIA vende hoje/i);
    }
    // Os dois que seguem valendo para a oferta atual mantêm a leitura.
    for (const fonte of ['McKinsey', 'Cetic']) {
      const e = porFonte(fonte);
      expect(e.offerRelation).toBe('oferta-atual');
      expect(typeof e.takeaway).toBe('string');
    }

    // Os casos: o de site é atual só em parte; o de SDR e o produto digital, não.
    expect(porSegmento('Design de interiores').offerRelation).toBe('parcial');
    expect(porSegmento('Design de interiores').note).toMatch(/criação do site/);
    expect(porSegmento('Crédito').offerRelation).toBe('historico');
    expect(porSegmento('Crédito').note).toMatch(/SDR/);
    expect(porSegmento('Produto digital de decoração').offerRelation).toBe('historico');
  });

  it('CTX-17: o vocabulário do produto anterior só aparece atrás de uma marca', () => {
    // Tira do JSON tudo o que está marcado como histórico (e a própria lista de
    // "não vendido hoje" e a legenda das marcas) e a bio, que é do consultor e
    // tem o CTX-18. O que sobrar é o que o agente lê como a empresa de hoje —
    // e não pode falar de SDR, automação, atendimento, gargalo ou piloto.
    const ativo = JSON.parse(JSON.stringify(publicado));
    ativo.evidence = ativo.evidence.filter((e: any) => e.offerRelation === 'oferta-atual');
    ativo.cases = ativo.cases.filter((c: any) => c.offerRelation === 'oferta-atual');
    delete ativo.positioning.notOfferedToday;
    delete ativo.positioning.historicalProof;
    delete ativo.consultant.bio;

    const ANTIGO =
      /\bSDR\b|automa[çc][ãa]o|atendimento|gargalo|pilotos?\b|qualifica[çc][ãa]o de leads?|processos? internos?/i;
    const restante = JSON.stringify(ativo);
    expect(restante, 'produto anterior descrito fora de um item marcado como histórico').not.toMatch(
      ANTIGO
    );

    // O caso "parcial" mistura os dois: não pode sair do contexto sem a marca, e
    // por isso ele NÃO entra no filtro acima — mas a nota tem de nomear o que
    // não é oferta atual, para o agente não vender a automação junto com o site.
    const parcial = publicado.cases.filter((c: any) => c.offerRelation === 'parcial');
    expect(parcial.length).toBeGreaterThan(0);
    for (const c of parcial) expect(c.note).toMatch(/não são oferta atual/);
  });

  it('CTX-18: o contexto diz o que se vende hoje e o que não se vende', () => {
    const { currentOffer, notOfferedToday, historicalProof } = publicado.positioning;
    expect(currentOffer).toMatch(/duas notas/);
    expect(currentOffer).toMatch(/site novo/);
    expect(currentOffer).toMatch(/otimizar/);

    // O que aparece na prova mas não é vendido está dito com todas as letras.
    const negado = notOfferedToday.join(' ');
    expect(negado).toMatch(/SDR/);
    expect(negado).toMatch(/[Aa]utomação/);
    expect(historicalProof).toMatch(/offerRelation/);
    expect(historicalProof).toMatch(/nunca como serviço disponível/);

    // A bio é a mesma que a página mostra, então não é reescrita — e por isso
    // "gargalo" só existe nela, com a nota dizendo que é método, não produto.
    const semBio = JSON.parse(JSON.stringify(publicado));
    delete semBio.consultant.bio;
    expect(JSON.stringify(semBio), '"gargalo" fora da bio do consultor').not.toMatch(/gargalo/i);
    expect(publicado.consultant.bio.join(' ')).toMatch(/gargalo/);
    expect(publicado.consultant.methodNote).toMatch(/método/);
    expect(publicado.consultant.methodNote).toMatch(/não descreve um produto à venda/);
    expect(publicado.consultant.methodNote).toContain('positioning.currentOffer');
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
