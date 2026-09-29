import { m } from 'motion/react';
import { useState, useEffect } from 'react';
import { useSiteScore } from '../context/SiteScoreContext';

const AI_HISTORY = [
  { year: '1950', text: 'ALAN_TURING' },
  { year: '1997', text: 'DEEP_BLUE' },
  { year: '2014', text: 'ALPHA_GO' },
  { year: '2018', text: 'ATTENTION_IS_ALL_YOU_NEED' },
  { year: '2022', text: 'CHAT_GPT' },
  { year: '2025', text: 'LLM_MASS_EXPANSION' },
  { year: '2026', text: 'SUA_EMPRESA_OTIMIZADA?' },
];

/**
 * Uma escala de cor so, a mesma dos cartoes do laudo (cortes 50 e 80): o
 * visitante nao pode ver vermelho no laudo e ambar no canto da tela.
 */
function toneOf(score: number | null) {
  if (score === null) return { text: 'text-slate-500', bar: 'bg-slate-300' };
  if (score < 50) return { text: 'text-red-700', bar: 'bg-red-500' };
  if (score < 80) return { text: 'text-amber-700', bar: 'bg-amber-500' };
  return { text: 'text-accent-dark', bar: 'bg-accent' };
}

interface Linha {
  rotulo: string;
  /** null = nao medido. Nunca 0: zero a tela leria como reprovacao. */
  score: number | null;
  /** O que aparece no lugar da nota quando ela nao existe. */
  ausente: string;
}

export default function EliteHUD({ activeScene = 0 }: { activeScene?: number }) {
  const { google, agentic, hasNoWebsite, measured } = useSiteScore();
  const [logs, setLogs] = useState<{ year: string; text: string }[]>([]);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const pushNextLog = () => {
      if (currentIndex >= AI_HISTORY.length) return;
      const entry = AI_HISTORY[currentIndex];
      setLogs((prev) => [entry, ...prev].slice(0, 7));
      currentIndex++;
      timeoutId = setTimeout(pushNextLog, Math.max(2500 * Math.pow(0.65, currentIndex - 1), 300));
    };

    timeoutId = setTimeout(pushNextLog, 1500);
    return () => clearTimeout(timeoutId);
  }, []);

  // As duas notas medidas, cada uma com o seu instrumento e nenhuma conta entre
  // elas. Sem site nao ha nota nenhuma: a linha unica diz isso em vez de
  // mostrar duas ausencias.
  const linhas: Linha[] = hasNoWebsite
    ? [{ rotulo: 'Site', score: null, ausente: 'não existe' }]
    : [
        { rotulo: 'Google', score: google ? google.score : null, ausente: 'não medido' },
        { rotulo: 'Agentes', score: agentic ? agentic.score : null, ausente: 'não medido' },
      ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] font-mono uppercase text-[9px] tracking-[0.2em] overflow-hidden">
      {/* As notas so aparecem depois de uma medicao ou declaracao. O HUD antigo
          exibia um indice inicial de 100% antes de qualquer medicao — um numero
          inventado no primeiro frame. Sem medicao, este bloco nao existe; a
          linha do tempo abaixo e do hero e continua. */}
      {/* top/right com env(): no iPhone a pilula ficava sob a Dynamic Island em
          paisagem, e no Android sob o recorte da camera. max() mantem o respiro
          de 1rem em aparelho sem recorte. */}
      {measured && (
        <div
          role="group"
          aria-label="Notas medidas do seu site"
          className={`glass-card absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] md:top-6 md:right-6 rounded-2xl ${
            hasNoWebsite ? 'glass-red glass-selected' : ''
          }`}
        >
          {/* Mobile: so os numeros. Tambem no celular deitado — ali a largura
              passa de 767px, mas sobram 390px de altura e o cartao grande comia
              um terco da tela. O criterio ali e a altura, nao a largura. */}
          <div className="flex md:hidden [@media(max-height:600px)]:flex items-center gap-3 px-3 py-2">
            {linhas.map((l) => (
              <span key={l.rotulo} className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold tracking-[0.14em] text-slate-600 leading-none">
                  {l.rotulo}
                </span>
                <span
                  className={`text-base font-serif italic font-black leading-none ${
                    hasNoWebsite ? 'text-red-700' : toneOf(l.score).text
                  }`}
                >
                  {l.score !== null ? l.score : l.ausente}
                </span>
              </span>
            ))}
          </div>

          {/* Desktop: uma linha por nota, com a barra da propria nota. */}
          <div className="hidden md:flex [@media(max-height:600px)]:hidden flex-col items-end gap-3 px-5 py-4 w-[178px]">
            <span
              className={`text-[9.5px] font-bold tracking-[0.2em] ${hasNoWebsite ? 'text-red-700' : 'text-slate-600'}`}
            >
              Notas medidas
            </span>

            {/* Barras estaticas, e de proposito: as antigas balancavam para
                sempre (a unica animacao infinita da pagina) desenhando um
                perfil que nao existe mais. Estas mostram o valor de cada nota
                e nao se mexem — nada aqui precisa de guarda de movimento
                reduzido (tests/movimento.test.ts, MOV-07). */}
            {linhas.map((l) => (
              <div key={l.rotulo} className="flex w-full flex-col items-end gap-1">
                <span className="text-[9px] font-bold tracking-[0.16em] text-slate-600">{l.rotulo}</span>
                <span
                  className={`text-2xl font-serif italic font-black leading-none tracking-tight ${
                    hasNoWebsite ? 'text-red-700' : toneOf(l.score).text
                  }`}
                >
                  {l.score !== null ? (
                    <>
                      {l.score}
                      <span className="text-xs text-slate-500">/100</span>
                    </>
                  ) : (
                    <span className="text-sm normal-case">{l.ausente}</span>
                  )}
                </span>
                {l.score !== null && (
                  <div className="h-1 w-full rounded-full bg-slate-900/10" aria-hidden="true">
                    <div
                      className={`h-full rounded-full ${toneOf(l.score).bar}`}
                      style={{ width: `${l.score}%` }}
                    />
                  </div>
                )}
              </div>
            ))}

            <span className="text-[9px] font-mono text-slate-600 font-bold tracking-wider normal-case">
              {hasNoWebsite ? 'Invisibilidade digital' : 'Duas notas, dois instrumentos'}
            </span>
          </div>
        </div>
      )}

      {/* Timeline — so no hero, so no desktop */}
      <div
        className="glass-card hidden lg:flex absolute bottom-8 left-8 flex-col gap-2 max-w-[240px] p-4 rounded-2xl transition-opacity duration-700"
        style={{ opacity: activeScene === 0 ? 1 : 0 }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-[2px] bg-accent" />
          <span className="text-accent-dark font-black tracking-widest text-[10px]">AI_Timeline_Sync</span>
        </div>
        {logs.map((log, i) => (
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1 - i * 0.12, x: 0 }}
            key={`${log.year}-${i}`}
            className="flex items-center gap-2"
          >
            <span className="text-[9px] font-black text-cyan-800">{`[${log.year}]`}</span>
            <span className={i === 0 ? 'text-slate-950 font-bold' : 'text-slate-600 font-medium'}>{log.text}</span>
          </m.div>
        ))}
      </div>
    </div>
  );
}
