import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { INTENTS, readCampaignRef, REF_LABEL, GREETING, NO_WEBSITE_GREETING } from '../src/content/intents';
import type { IntentContext, IntentId } from '../src/content/intents';
import { PATHS } from '../src/content/paths';

const IDS: IntentId[] = ['report-result', 'sem-site', 'path-pick', 'credibility'];

const base: IntentContext = {
  ref: null,
  googleScore: null,
  agenticScore: null,
  hasNoWebsite: false,
};

/** Todos os estados de borda que o site consegue produzir. */
const CONTEXTS: IntentContext[] = [
  base,
  { ...base, ref: 'industria' },
  { ...base, ref: 'servicos' },
  { ...base, ref: 'varejo' },
  // Cada nota sozinha, e as duas, nas quatro faixas. 0 e 100 sao medicoes
  // validas — nao ausencias.
  { ...base, googleScore: 0 },
  { ...base, googleScore: 49 },
  { ...base, googleScore: 63 },
  { ...base, googleScore: 100 },
  { ...base, agenticScore: 0 },
  { ...base, agenticScore: 49 },
  { ...base, agenticScore: 63 },
  { ...base, agenticScore: 100 },
  { ...base, googleScore: 42, agenticScore: 66 },
  { ...base, googleScore: 95, agenticScore: 10 },
  { ...base, hasNoWebsite: true },
  ...PATHS.map((path) => ({ ...base, path })),
  ...PATHS.map((path) => ({ ...base, googleScore: 63, agenticScore: 41, path })),
];

const lerTexto = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('INTENTS: as quatro intencoes cobrem todos os estados', () => {
  it('INT-01: existem exatamente as quatro intencoes', () => {
    expect(Object.keys(INTENTS).sort()).toEqual([...IDS].sort());
  });

  it('INT-02: toda intencao declara o proprio id', () => {
    for (const id of IDS) expect(INTENTS[id].id).toBe(id);
  });

  it('INT-03: nenhum template vaza undefined, null, NaN ou chave nao substituida', () => {
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        for (const texto of [INTENTS[id].userMessage(ctx), INTENTS[id].agentReply(ctx)]) {
          expect(texto).not.toMatch(/undefined|null|NaN|\{|\}/);
          expect(texto.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('INT-04: nenhum texto tem espaco duplo ou espaco antes de pontuacao', () => {
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        for (const texto of [INTENTS[id].userMessage(ctx), INTENTS[id].agentReply(ctx)]) {
          expect(texto).not.toMatch(/ {2}/);
          expect(texto).not.toMatch(/ [.,?!]/);
        }
      }
    }
  });

  it('INT-26: a fala do lead nunca tem aspas duplas', () => {
    // A fala se apresenta como algo que a pessoa digitou. Aspas duplas viram
    // citacao — e o lead nao cita o proprio botao.
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        expect(INTENTS[id].userMessage(ctx)).not.toContain('"');
      }
    }
  });

  it('INT-27: o agente nunca abre repetindo a saudacao do balao 1', () => {
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        const resposta = INTENTS[id].agentReply(ctx);
        expect(resposta).not.toMatch(/^Olá/);
        expect(resposta).not.toContain('Sou o Agente de Inteligência');
        expect(resposta).not.toBe(GREETING);
        expect(resposta).not.toBe(NO_WEBSITE_GREETING);
      }
    }
  });

  it('INT-28: nenhuma intencao promete o que a pagina deixou de vender', () => {
    // O "diagnostico de gargalo", as tres frentes e o indice de vulnerabilidade
    // sairam da pagina; uma fala do agente que os prometa apresenta ao lead uma
    // oferta que ele nao leu em lugar nenhum.
    for (const id of IDS) {
      for (const ctx of CONTEXTS) {
        for (const texto of [INTENTS[id].userMessage(ctx), INTENTS[id].agentReply(ctx)]) {
          expect(texto).not.toMatch(/gargalo|frente|vulnerab|índice|indice/i);
        }
      }
    }
  });
});

/** Todo .ts/.tsx sob src/, exceto o arquivo das próprias intenções. */
function fontesDaInterface(dir = 'src'): string[] {
  const raiz = resolve(process.cwd(), dir);
  return readdirSync(raiz, { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return fontesDaInterface(rel);
    return /\.tsx?$/.test(e.name) && rel !== 'src/content/intents.ts' ? [rel] : [];
  });
}

describe('INTENTS: nenhuma intencao vive sem gatilho', () => {
  it('INT-38: toda intencao declarada e pedida por algum componente', () => {
    // A hero-cold ficou publicada sem botao que a chamasse, e a report-result
    // idem: o hero e o laudo perderam seus CTAs na troca de posicionamento e
    // ninguem notou, porque cada arquivo, sozinho, estava correto. Aqui a fonte
    // da verdade e a interface: sem requestIntent('id') a intencao e codigo
    // morto — apague-a ou ligue-a a um botao.
    const interface_ = fontesDaInterface()
      .map((f) => lerTexto(f))
      .join('\n')
      // Comentario que cite requestIntent('id') nao e gatilho.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const id of Object.keys(INTENTS)) {
      expect(interface_, `intencao "${id}" sem gatilho na interface`).toContain(
        `requestIntent('${id}'`
      );
    }
  });
});

describe('report-result: as duas notas entram na fala, cada uma na sua voz', () => {
  const fala = (ctx: Partial<IntentContext>) => INTENTS['report-result'].userMessage({ ...base, ...ctx });
  const resposta = (ctx: Partial<IntentContext>) => INTENTS['report-result'].agentReply({ ...base, ...ctx });

  it('INT-07: com as duas notas, os dois numeros aparecem na fala do lead', () => {
    expect(fala({ googleScore: 63, agenticScore: 41 })).toBe(
      'Meu site tirou 63/100 no Google e 41/100 em prontidão para agentes. Quero entender o que isso me custa.'
    );
  });

  it('INT-08: sem nota nenhuma, a fala degrada para a variante sem numero', () => {
    const texto = fala({});
    expect(texto).not.toMatch(/\d/);
    expect(texto).toContain('Medi meu site');
  });

  it('INT-09: a resposta muda de faixa junto com cada nota', () => {
    const g = (score: number) => resposta({ googleScore: score });
    expect(g(30)).not.toBe(g(63));
    expect(g(63)).not.toBe(g(90));
    const a = (score: number) => resposta({ agenticScore: score });
    expect(a(30)).not.toBe(a(63));
    expect(a(63)).not.toBe(a(90));
  });

  it('INT-22: com as duas notas, o agente comenta as duas, cada uma no seu instrumento', () => {
    expect(resposta({ googleScore: 63, agenticScore: 41 })).toBe(
      '63/100 no Google. Essa nota quer dizer que o site funciona, mas não compete. 41/100 em prontidão para agentes: os agentes de IA não conseguem ler nem citar o seu site. Me diz o que sua empresa vende e para quem — eu volto com o que consertar primeiro e o que isso muda em quem chega até você.'
    );
  });

  it('INT-23: nota alta nao e tratada como problema, e a outra nota nao contamina a leitura', () => {
    const texto = resposta({ googleScore: 95, agenticScore: 10 });
    expect(texto).toContain('95/100 no Google. Essa nota é boa');
    expect(texto).toContain('10/100 em prontidão para agentes: os agentes de IA não conseguem ler');
  });

  it('INT-29: uma nota sozinha diz que a outra nao foi medida, em vez de calar', () => {
    const soGoogle = resposta({ googleScore: 63 });
    expect(soGoogle).toContain('63/100 no Google');
    expect(soGoogle).toContain('A nota de prontidão para agentes não foi medida.');
    expect(soGoogle).not.toMatch(/\/100 em prontidão/);

    const soAgentes = resposta({ agenticScore: 41 });
    expect(soAgentes).toContain('41/100 em prontidão para agentes');
    expect(soAgentes).toContain('A nota do Google não foi medida.');
    expect(soAgentes).not.toMatch(/\/100 no Google/);
  });

  it('INT-30: zero medido e nota, nao ausencia', () => {
    // Um site que tirou 0 existe e foi medido. Tratar 0 como "sem nota"
    // (falsy) apagaria justamente o pior resultado possivel.
    expect(fala({ googleScore: 0 })).toContain('0/100 no Google');
    expect(resposta({ googleScore: 0 })).toContain('0/100 no Google');
    expect(resposta({ googleScore: 0 })).not.toContain('A nota do Google não foi medida');
    expect(fala({ agenticScore: 0 })).toContain('0/100 em prontidão para agentes');
    expect(resposta({ agenticScore: 0 })).toContain('0/100 em prontidão para agentes');
  });

  it('INT-31: sem nota nenhuma, o agente nao inventa numero', () => {
    expect(resposta({})).not.toMatch(/\d/);
  });

  it('INT-32: nenhuma fala junta as duas notas numa terceira', () => {
    for (const ctx of CONTEXTS) {
      for (const texto of [fala(ctx), resposta(ctx)]) {
        expect(texto).not.toMatch(/média|media|nota geral|nota final|no total|somando|soma d/i);
      }
    }
    // E quando as duas existem, cada numero aparece exatamente como foi medido:
    // 42 e 66 — e nenhum 54 (a media) nem 108 (a soma) no texto.
    const texto = resposta({ googleScore: 42, agenticScore: 66 });
    expect(texto).toContain('42/100');
    expect(texto).toContain('66/100');
    expect(texto).not.toMatch(/\b54\b|\b108\b/);
  });
});

describe('path-pick: um caminho escolhido no cartao', () => {
  it('INT-10: cada caminho injeta o proprio rotulo, promessa e sondagem', () => {
    for (const path of PATHS) {
      const ctx = { ...base, path };
      expect(INTENTS['path-pick'].userMessage(ctx)).toBe(`Quero falar sobre o caminho ${path.label}.`);
      const resposta = INTENTS['path-pick'].agentReply(ctx);
      expect(resposta).toContain(path.promise);
      expect(resposta).toContain(path.probe);
    }
  });

  it('INT-33: os dois caminhos geram falas diferentes', () => {
    const [a, b] = PATHS.map((path) => INTENTS['path-pick'].agentReply({ ...base, path }));
    expect(a).not.toBe(b);
  });

  it('INT-34: sem caminho no contexto, cai no primeiro em vez de imprimir undefined', () => {
    const fala = INTENTS['path-pick'].userMessage(base);
    expect(fala).toContain(PATHS[0].label);
    expect(fala).not.toContain('undefined');
  });
});

describe('sem-site: quem nao tem onde ser encontrado', () => {
  it('INT-15: a resposta e o texto proprio da intencao, nao a saudacao do balao 1', () => {
    const resposta = INTENTS['sem-site'].agentReply(base);
    expect(resposta).toBe(
      'Então a ordem é outra: antes de otimizar qualquer coisa, você precisa existir para quem procura o que vende. Me diz o que sua empresa faz e para quem — eu volto com o que precisa estar no ar primeiro, e em quanto tempo.'
    );
    expect(resposta).not.toBe(NO_WEBSITE_GREETING);
  });

  it('INT-35: a fala do lead diz que nao tem site, sem nota nenhuma', () => {
    const fala = INTENTS['sem-site'].userMessage({ ...base, hasNoWebsite: true });
    expect(fala).toContain('Ainda não tenho site');
    expect(fala).not.toMatch(/\d/);
  });
});

describe('credibility: quem leu os casos', () => {
  it('INT-36: fala do site, e a resposta pergunta como as pessoas encontram a empresa hoje', () => {
    expect(INTENTS.credibility.userMessage(base)).toBe(
      'Vi os casos. Quero saber o que dá pra fazer no meu site.'
    );
    expect(INTENTS.credibility.agentReply(base)).toContain('como as pessoas te encontram hoje');
  });
});

describe('readCampaignRef: o ?ref da campanha', () => {
  it('INT-16: le e normaliza para minuscula', () => {
    expect(readCampaignRef('?ref=INDUSTRIA')).toBe('industria');
  });

  it('INT-17: ref ausente ou desconhecido vira null', () => {
    expect(readCampaignRef('')).toBeNull();
    expect(readCampaignRef('?ref=agropecuaria')).toBeNull();
    expect(readCampaignRef('?utm_source=x')).toBeNull();
  });

  it('INT-18: todo ref aceito tem etiqueta legivel', () => {
    for (const key of Object.keys(REF_LABEL)) {
      expect(readCampaignRef(`?ref=${key}`)).toBe(key);
      expect(REF_LABEL[key].trim().length).toBeGreaterThan(0);
    }
  });
});

describe('As saudacoes saem do componente e passam a morar aqui', () => {
  it('INT-19: as duas existem e sao diferentes', () => {
    expect(GREETING.trim().length).toBeGreaterThan(0);
    expect(NO_WEBSITE_GREETING.trim().length).toBeGreaterThan(0);
    expect(GREETING).not.toBe(NO_WEBSITE_GREETING);
  });

  it('INT-37: a saudacao de quem nao tem site nao carrega mais o "101%" do indice extinto', () => {
    // O texto explicava que o indice era marcado "fora da escala, em 101%".
    // O indice saiu da pagina; um percentual inventado nao pode sobreviver na
    // primeira frase que o agente diz a quem nao tem site.
    for (const saudacao of [GREETING, NO_WEBSITE_GREETING]) {
      expect(saudacao).not.toMatch(/\d/);
      expect(saudacao).not.toMatch(/%|índice|gargalo|frente/i);
    }
  });
});
