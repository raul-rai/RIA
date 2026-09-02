import { m, useReducedMotion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useVulnerability } from '../context/VulnerabilityContext';

const AI_HISTORY = [
  { year: '1950', text: 'ALAN_TURING' },
  { year: '1997', text: 'DEEP_BLUE' },
  { year: '2014', text: 'ALPHA_GO' },
  { year: '2018', text: 'ATTENTION_IS_ALL_YOU_NEED' },
  { year: '2022', text: 'CHAT_GPT' },
  { year: '2025', text: 'LLM_MASS_EXPANSION' },
  { year: '2026', text: 'SUA_EMPRESA_OTIMIZADA?' },
];

function toneOf(index: number, hasNoWebsite: boolean) {
  if (hasNoWebsite || index > 60) return { text: 'text-red-600', bar: '#ef4444' };
  if (index > 35) return { text: 'text-amber-600', bar: '#f59e0b' };
  return { text: 'text-emerald-600', bar: '#10b981' };
}

export default function EliteHUD({ activeScene = 0 }: { activeScene?: number }) {
  const { vulnerabilityIndex, assessed, hasNoWebsite } = useVulnerability();
  const reduzMovimento = useReducedMotion();
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

  // O indice ja resolve o caso "sem site" sozinho (101). Reescreve-lo para 100
  // aqui era o que escondia do visitante o unico numero que devia assusta-lo.
  const val = vulnerabilityIndex;
  const tone = toneOf(val, hasNoWebsite);
  const label = String(val);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] font-mono uppercase text-[9px] tracking-[0.2em] overflow-hidden">
      {/* Indice — pilula compacta no mobile, cartao no desktop. Largura contida
          para nao invadir a coluna de conteudo dos capitulos. */}
      {/* top/right com env(): no iPhone a pilula ficava sob a Dynamic Island em
          paisagem, e no Android sob o recorte da camera. max() mantem o respiro
          de 1rem em aparelho sem recorte. */}
      <div
        className={`glass-card absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] md:top-6 md:right-6 rounded-2xl ${
          hasNoWebsite ? 'glass-red glass-selected' : ''
        }`}
      >
        {/* Mobile: so o numero. Tambem no celular deitado — ali a largura passa
            de 767px, mas sobram 390px de altura e o cartao grande comia um
            terco da tela. O criterio ali e a altura, nao a largura. */}
        <div className="flex md:hidden [@media(max-height:600px)]:flex items-center gap-2 px-3 py-2">
          <span className="text-[8px] font-bold tracking-[0.14em] text-slate-500 leading-none">
            {assessed || hasNoWebsite ? 'VULNERAB.' : 'RISCO'}
          </span>
          <span
            className={`text-base font-serif italic font-black leading-none ${
              assessed || hasNoWebsite ? tone.text : 'text-slate-400'
            }`}
          >
            {assessed || hasNoWebsite ? `${label}%` : '—'}
          </span>
        </div>

        {/* Desktop: numero + barras */}
        <div className="hidden md:flex [@media(max-height:600px)]:hidden flex-col items-end gap-2 px-5 py-4 w-[178px]">
          <span
            className={`text-[9.5px] font-bold tracking-[0.2em] ${hasNoWebsite ? 'text-red-600' : 'text-slate-600'}`}
          >
            Vulnerability Index
          </span>

          {/*
            A ÚNICA animação infinita da página, e por isso a única que precisa
            de guarda explícita.

            O `<MotionConfig reducedMotion="user">` do App já cobriria: `height`
            está no conjunto de chaves posicionais do motion, então a transição
            viraria `{type: false}` sob a preferência do usuário. Mas depender
            disso seria depender de um detalhe INTERNO da biblioteca — o dia em
            que `height` sair daquele conjunto, estas barras voltam a pulsar
            para sempre e ninguém fica sabendo.

            Aqui a decisão fica na superfície: com movimento reduzido as barras
            são estáticas, na altura de repouso. Elas continuam desenhando o
            perfil do índice pela COR, que é onde mora a informação — o
            balanço sempre foi enfeite. É o critério 2.2.2 (Pausar, Parar,
            Ocultar): conteúdo em movimento automático que dura mais de cinco
            segundos precisa ter como parar, e "para sempre" é bem mais que
            cinco segundos.
          */}
          <div className="flex items-end gap-1.5 h-6 w-full justify-end">
            {[55, 65, 80, 65, 50, 60, 78, 50, 75, 65].map((base, i) => {
              const threshold = Math.floor((val / 100) * 10);
              const isCritical = i >= Math.max(2, 10 - threshold);
              return (
                <m.div
                  key={i}
                  animate={
                    reduzMovimento
                      ? undefined
                      : { height: [`${base}%`, `${Math.min(100, base + 12)}%`, `${base}%`] }
                  }
                  transition={
                    reduzMovimento
                      ? undefined
                      : { duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1, ease: 'easeInOut' }
                  }
                  // A altura precisa vir do style quando não há animação: sem
                  // ela a barra nasce com 0 de altura e o gráfico some.
                  style={{
                    backgroundColor: isCritical ? tone.bar : '#cbd5e1',
                    ...(reduzMovimento ? { height: `${base}%` } : null),
                  }}
                  className="w-1.5 rounded-full transition-colors duration-500"
                />
              );
            })}
          </div>

          <span className={`text-3xl font-serif italic font-black leading-none tracking-tight ${tone.text}`}>
            {label}%
          </span>

          <span className="text-[9px] font-mono text-slate-500 font-bold tracking-wider normal-case">
            {hasNoWebsite
              ? 'Invisibilidade digital'
              : assessed
                ? 'Atualiza conforme você responde'
                : 'Responda para reduzir o risco'}
          </span>
        </div>
      </div>

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
