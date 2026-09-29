import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { INTENTS } from '../src/content/intents';
import { PATHS } from '../src/content/paths';

const root = (p: string) => resolve(process.cwd(), p);
const secao = readFileSync(root('src/components/PathsSection.tsx'), 'utf-8');
const semComentarios = (t: string) =>
  t.replace(/(?<![*\w'"])\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('CAMINHOS: a dobra', () => {
  it('CAM-01: renderiza os dois caminhos a partir do conteúdo', () => {
    expect(secao).toContain('PATHS.map');
    expect(secao).toContain('choosePath');
  });

  it('CAM-02: a escolha leva ao agente, carregando o caminho clicado', () => {
    // O caminho vai no pedido (segundo argumento): o agente não espera o estado
    // do laudo assentar para saber qual cartão foi clicado. O teste do brief
    // procurava `requestIntent('path-pick')` fechado, o que reprovaria essa
    // chamada.
    expect(secao).toMatch(/requestIntent\('path-pick',\s*p\.id\)/);
  });

  it('CAM-03: nenhuma menção a frente sobrou', () => {
    // Vale para a fonte inteira, comentários incluídos: um comentário que
    // descreve "a dobra das três frentes" também é a dobra antiga vazando.
    expect(secao).not.toMatch(/frente|Front/i);
  });

  it('CAM-09: a seção não decide o caminho, só lê o que o laudo já resolveu', () => {
    // A regra de sugestão mora em lib/paths.ts. Se a seção lesse uma nota, ela
    // teria uma segunda regra — e ela divergiria da primeira.
    const corpo = semComentarios(secao);
    expect(corpo).not.toMatch(/\.score|googleScore|agenticScore|hasNoWebsite/);
    expect(corpo).toMatch(/const\s*\{\s*path:\s*sugerido,\s*choosePath\s*\}\s*=\s*useSiteScore\(\)/);
    expect(corpo).toMatch(/sugerido\s*===\s*p\.id/);
  });

  it('CAM-10: a escolha do visitante é gravada antes de o agente ser chamado', () => {
    const corpo = semComentarios(secao);
    expect(corpo.indexOf('choosePath(p.id)')).toBeGreaterThan(-1);
    expect(corpo.indexOf('choosePath(p.id)')).toBeLessThan(corpo.indexOf("requestIntent('path-pick'"));
  });
});

describe('CAMINHOS: o agente', () => {
  it('CAM-04: as intenções são as quatro que a página ainda usa', () => {
    expect(Object.keys(INTENTS).sort()).toEqual(
      ['credibility', 'path-pick', 'report-result', 'sem-site'].sort()
    );
  });

  it('CAM-05: a fala do lead cita o caminho escolhido', () => {
    for (const path of PATHS) {
      const fala = INTENTS['path-pick'].userMessage({
        ref: null, googleScore: null, agenticScore: null, hasNoWebsite: false, path,
      });
      expect(fala).toContain(path.label);
    }
  });

  it('CAM-06: com as duas notas, o agente comenta as duas', () => {
    const resposta = INTENTS['report-result'].agentReply({
      ref: null, googleScore: 42, agenticScore: 66, hasNoWebsite: false,
    });
    expect(resposta).toContain('42');
    expect(resposta).toContain('66');
  });

  it('CAM-07: sem nota, o agente não inventa número', () => {
    const resposta = INTENTS['report-result'].agentReply({
      ref: null, googleScore: null, agenticScore: null, hasNoWebsite: false,
    });
    expect(resposta).not.toMatch(/\d+\s*\/\s*100/);
  });

  it('CAM-08: nenhuma intenção promete diagnóstico de gargalo', () => {
    const tudo = Object.values(INTENTS)
      .map((i) => i.userMessage({ ref: null, googleScore: 50, agenticScore: 50, hasNoWebsite: false, path: PATHS[0] })
        + i.agentReply({ ref: null, googleScore: 50, agenticScore: 50, hasNoWebsite: false, path: PATHS[0] }))
      .join(' ');
    expect(tudo).not.toMatch(/gargalo/i);
  });
});

describe('CAMINHOS: a fiação do agente', () => {
  const agente = semComentarios(readFileSync(root('src/components/AIChatAgent.tsx'), 'utf-8'));
  const canal = semComentarios(readFileSync(root('src/context/AgentIntentContext.tsx'), 'utf-8'));

  it('CAM-11: o agente lê as duas notas do SiteScoreContext, e nada do índice antigo', () => {
    expect(agente).toContain('useSiteScore()');
    expect(agente).not.toMatch(/vulnerab|frontsChecked|websiteScore|FRONTS|missingFronts|frontId/i);
  });

  it('CAM-12: os três payloads levam o mesmo contexto: notas separadas, sem índice', () => {
    // sendMessage e intent partilham o objeto `contexto`; a qualificação monta o
    // dela pelo buildQualificationPayload. Um payload que fugisse do formato
    // faria o workflow do n8n ler campos que não existem.
    expect(agente.match(/context:\s*contexto\b/g) ?? []).toHaveLength(2);
    const qualificacao = agente.slice(agente.indexOf('buildQualificationPayload({'));
    const bloco = qualificacao.slice(0, qualificacao.indexOf('})'));
    for (const campo of ['hasNoWebsite', 'googleScore', 'agenticScore', 'path']) {
      expect(bloco, `a qualificação não leva ${campo}`).toContain(campo);
    }
    expect(agente).toMatch(/const contexto = useMemo\(\s*\(\) => \(\{ hasNoWebsite, googleScore, agenticScore, path \}\)/);
  });

  it('CAM-13: ausência de nota nunca vira zero no agente', () => {
    expect(agente).not.toMatch(/\?\?\s*0\b|\|\|\s*0\b/);
    expect(agente).toMatch(/const googleScore = google \? google\.score : null/);
    expect(agente).toMatch(/const agenticScore = agentic \? agentic\.score : null/);
  });

  it('CAM-14: o pedido de intenção carrega um PathId, não uma frente, e lê as notas do SiteScoreContext', () => {
    expect(canal).toContain('useSiteScore()');
    expect(canal).toMatch(/requestIntent:\s*\(id: IntentId, pathId\?: PathId\) => void/);
    expect(canal).not.toMatch(/vulnerab|FrontId|frontId|frontsChecked|fronts_covered/i);
  });

  it('CAM-15: a telemetria reporta as duas notas em campos separados', () => {
    expect(canal).toMatch(/google_score:\s*googleScore/);
    expect(canal).toMatch(/agentic_score:\s*agenticScore/);
    expect(canal).not.toMatch(/\?\?\s*0\b|\|\|\s*0\b/);
  });

  it('CAM-16: o agente escolhe o caminho do pedido antes do que o laudo sugere', () => {
    expect(agente).toMatch(/pending\.pathId\s*\?\s*pathById\(pending\.pathId\)\s*:\s*path\s*\?\s*pathById\(path\)/);
  });
});

describe('CAMINHOS: o HUD mostra só o que foi medido', () => {
  const hud = readFileSync(root('src/components/EliteHUD.tsx'), 'utf-8');
  const corpo = semComentarios(hud);

  it('HUD-01: sem medição, o bloco das notas não existe — e a linha do tempo do hero continua', () => {
    // `if (!measured) return null` derrubaria a linha do tempo junto: ela é
    // decoração do hero e não depende de medição nenhuma.
    expect(corpo).not.toMatch(/if\s*\(\s*!measured\s*\)\s*return/);
    const abre = corpo.indexOf('{measured && (');
    expect(abre, 'o bloco das notas não está condicionado a `measured`').toBeGreaterThan(-1);
    const linhaDoTempo = corpo.indexOf('AI_Timeline_Sync');
    expect(linhaDoTempo).toBeGreaterThan(abre);
    // A linha do tempo fica FORA do condicional: o `)}` que o fecha vem antes.
    const fecha = corpo.lastIndexOf(')}', linhaDoTempo);
    expect(fecha).toBeGreaterThan(abre);
    expect(corpo.slice(abre, fecha)).not.toContain('AI_Timeline_Sync');
  });

  it('HUD-02: exibe as duas notas, cada uma "não medido" quando ausente, nunca 0', () => {
    expect(corpo).toMatch(/google \? google\.score : null/);
    expect(corpo).toMatch(/agentic \? agentic\.score : null/);
    expect(corpo).toContain("'não medido'");
    expect(corpo).not.toMatch(/\?\?\s*0\b|\|\|\s*0\b/);
    // O índice extinto não volta pela porta do HUD.
    expect(corpo).not.toMatch(/vulnerab|assessed/i);
  });
});
