import { describe, it, expect } from 'vitest';
import { INTENTS, readCampaignRef, REF_LABEL, GREETING, NO_WEBSITE_GREETING } from '../src/content/intents';
import type { IntentContext, IntentId } from '../src/content/intents';
import { FRONTS } from '../src/content/fronts';

const IDS: IntentId[] = [
  'hero-cold',
  'diagnostic-result',
  'diagnostic-no-website',
  'front-pick',
  'fronts-agenda',
  'credibility',
];

const base: IntentContext = {
  ref: null,
  websiteScore: null,
  hasNoWebsite: false,
  frontsChecked: [false, false, false, false, false],
};

/** Todos os estados de borda que o site consegue produzir. */
const CONTEXTS: IntentContext[] = [
  base,
  { ...base, ref: 'industria' },
  { ...base, ref: 'servicos' },
  { ...base, ref: 'varejo' },
  { ...base, websiteScore: 0 },
  { ...base, websiteScore: 49 },
  { ...base, websiteScore: 63 },
  { ...base, websiteScore: 100 },
  { ...base, hasNoWebsite: true },
  { ...base, frontsChecked: [true, false, false, false, false] },
  { ...base, frontsChecked: [true, true, true, true, false] },
  { ...base, frontsChecked: [true, true, true, true, true] },
  ...FRONTS.map((front) => ({ ...base, front })),
];

describe('INTENTS: as seis intencoes cobrem todos os estados', () => {
  it('INT-01: existem exatamente as seis intencoes do spec', () => {
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
});

describe('hero-cold: o lead frio, com ou sem campanha', () => {
  it('INT-05: sem ref, a frase nao menciona segmento', () => {
    expect(INTENTS['hero-cold'].userMessage(base)).toBe(
      'Quero me adaptar primeiro — antes do meu concorrente. Por onde eu começo?'
    );
  });

  it('INT-06: com ref, o segmento abre a frase', () => {
    expect(INTENTS['hero-cold'].userMessage({ ...base, ref: 'industria' })).toBe(
      'Tenho uma indústria e quero me adaptar primeiro — antes do meu concorrente. Por onde eu começo?'
    );
  });

  it('INT-24: a resposta para de ecoar a saudacao do balao 1', () => {
    expect(INTENTS['hero-cold'].agentReply(base)).toBe(
      'Começa por saber onde está o vazamento. Na maioria das operações ele está em três lugares: lead que não é respondido, rotina que consome hora de gente cara, e decisão tomada no achismo. Me diz o que sua empresa faz — eu volto com qual dos três está te custando mais.'
    );
  });
});

describe('diagnostic-result: a nota entra na fala', () => {
  it('INT-07: com nota, o numero aparece na fala do lead', () => {
    expect(INTENTS['diagnostic-result'].userMessage({ ...base, websiteScore: 63 })).toBe(
      'Meu site tirou 63/100 no diagnóstico. Quero entender o que isso me custa.'
    );
  });

  it('INT-08: sem nota, degrada para a variante sem numero', () => {
    const texto = INTENTS['diagnostic-result'].userMessage(base);
    expect(texto).not.toMatch(/\d/);
    expect(texto).toContain('diagnóstico');
  });

  it('INT-09: a resposta muda de faixa junto com a nota', () => {
    const r = (score: number) => INTENTS['diagnostic-result'].agentReply({ ...base, websiteScore: score });
    expect(r(30)).not.toBe(r(63));
    expect(r(63)).not.toBe(r(90));
  });

  it('INT-22: nota abaixo de 80, a cauda fala do custo que passa longe', () => {
    expect(INTENTS['diagnostic-result'].agentReply({ ...base, websiteScore: 63 })).toBe(
      'Essa nota quer dizer que o site funciona, mas não compete. A nota é sintoma — o custo está nas buscas e nas citações de IA que passam longe de você. Me diz o que sua empresa vende e pra quem.'
    );
  });

  it('INT-23: nota 80 ou mais, a cauda para de contradizer a nota boa', () => {
    expect(INTENTS['diagnostic-result'].agentReply({ ...base, websiteScore: 95 })).toBe(
      'Essa nota é boa — o site sustenta, e o gargalo está em outra frente. Então o gargalo não está na vitrine: está no que acontece depois que o lead chega. Me diz o que sua empresa vende e pra quem.'
    );
  });
});

describe('front-pick: uma frente escolhida no cartao', () => {
  it('INT-10: cada frente injeta o proprio numero, label e sondagem', () => {
    for (const front of FRONTS) {
      const ctx = { ...base, front };
      expect(INTENTS['front-pick'].userMessage(ctx)).toBe(
        `Quero falar sobre a frente ${front.id}: ${front.label}.`
      );
      const resposta = INTENTS['front-pick'].agentReply(ctx);
      expect(resposta).toContain(front.promise);
      expect(resposta).toContain(front.probe);
    }
  });
});

describe('fronts-agenda: a pauta muda com o que foi marcado', () => {
  it('INT-11: zero marcadas tem frase propria, sem contagem', () => {
    expect(INTENTS['fronts-agenda'].userMessage(base)).toBe(
      'Não cubro nenhuma das seis frentes. Quero montar minha pauta.'
    );
  });

  it('INT-12: parcial lista as faltantes com "e" antes da ultima', () => {
    const texto = INTENTS['fronts-agenda'].userMessage({
      ...base,
      frontsChecked: [true, false, false, false, false, false],
    });
    expect(texto).toBe(
      'Marquei 1 de 6. Faltam Agente SDR, Conteúdo, Automação, Sistema sob medida e Dados e decisão. Quero montar minha pauta.'
    );
  });

  it('INT-20: resta uma frente, o verbo concorda no singular ("Falta")', () => {
    const texto = INTENTS['fronts-agenda'].userMessage({
      ...base,
      frontsChecked: [true, true, true, true, true, false],
    });
    expect(texto).toBe('Marquei 5 de 6. Falta Dados e decisão. Quero montar minha pauta.');
  });

  it('INT-21: restam duas frentes, o verbo concorda no plural ("Faltam")', () => {
    const texto = INTENTS['fronts-agenda'].userMessage({
      ...base,
      frontsChecked: [true, true, true, true, false, false],
    });
    expect(texto).toBe(
      'Marquei 4 de 6. Faltam Sistema sob medida e Dados e decisão. Quero montar minha pauta.'
    );
  });

  it('INT-13: seis marcadas viram conversa de otimizacao, nao de pauta', () => {
    const ctx = { ...base, frontsChecked: [true, true, true, true, true, true] };
    expect(INTENTS['fronts-agenda'].userMessage(ctx)).toBe(
      'Marquei as seis frentes. Quero saber o que ainda dá pra melhorar.'
    );
    expect(INTENTS['fronts-agenda'].agentReply(ctx)).not.toContain('Pauta anotada');
  });

  it('INT-14: a resposta abre pela primeira frente descoberta', () => {
    const resposta = INTENTS['fronts-agenda'].agentReply({
      ...base,
      frontsChecked: [true, false, false, false, false],
    });
    expect(resposta).toContain(FRONTS[1].label);
  });
});

describe('diagnostic-no-website: quem nao tem onde ser encontrado', () => {
  it('INT-15: a resposta e o texto proprio da intencao, nao a saudacao do balao 1', () => {
    const resposta = INTENTS['diagnostic-no-website'].agentReply(base);
    expect(resposta).toBe(
      'Isso muda a ordem das coisas: antes de automatizar qualquer processo, você precisa existir para quem procura o que você vende. Me diz o que sua empresa faz e para quem — eu volto com o que precisa estar no ar primeiro, e em quanto tempo.'
    );
    expect(resposta).not.toBe(NO_WEBSITE_GREETING);
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
});
