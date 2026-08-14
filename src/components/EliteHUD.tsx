import { motion } from 'motion/react';
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

  const val = hasNoWebsite ? 100 : vulnerabilityIndex;
  const tone = toneOf(val, hasNoWebsite);
  const label = String(val);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] font-mono uppercase text-[9px] tracking-[0.2em] overflow-hidden">
      {/* Indice — pilula compacta no mobile, cartao no desktop. Largura contida
          para nao invadir a coluna de conteudo dos capitulos. */}
      <div
        className={`absolute top-4 right-4 md:top-6 md:right-6 rounded-2xl bg-white/95 border shadow-[0_8px_24px_rgba(0,0,0,.07)] backdrop-blur-md transition-all duration-500 ${
          hasNoWebsite ? 'border-red-300 ring-2 ring-red-400/20' : 'border-slate-200'
        }`}
      >
        {/* Mobile: so o numero */}
        <div className="flex md:hidden items-center gap-2 px-3 py-2">
          <span className="text-[8px] font-bold tracking-[0.14em] text-slate-500 leading-none">
            VULNERAB.
          </span>
          <span className={`text-base font-serif italic font-black leading-none ${tone.text}`}>
            {label}%
          </span>
        </div>

        {/* Desktop: numero + barras */}
        <div className="hidden md:flex flex-col items-end gap-2 px-5 py-4 w-[178px]">
          <span
            className={`text-[9.5px] font-bold tracking-[0.2em] ${hasNoWebsite ? 'text-red-600' : 'text-slate-600'}`}
          >
            Vulnerability Index
          </span>

          <div className="flex items-end gap-1.5 h-6 w-full justify-end">
            {[55, 65, 80, 65, 50, 60, 78, 50, 75, 65].map((base, i) => {
              const threshold = Math.floor((val / 100) * 10);
              const isCritical = i >= Math.max(2, 10 - threshold);
              return (
                <motion.div
                  key={i}
                  animate={{ height: [`${base}%`, `${Math.min(100, base + 12)}%`, `${base}%`] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1, ease: 'easeInOut' }}
                  style={{ backgroundColor: isCritical ? tone.bar : '#cbd5e1' }}
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
        className="hidden lg:flex absolute bottom-8 left-8 flex-col gap-2 max-w-[240px] p-4 rounded-2xl bg-white/85 border border-slate-200/80 shadow-md backdrop-blur-md transition-opacity duration-700"
        style={{ opacity: activeScene === 0 ? 1 : 0 }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-[2px] bg-accent" />
          <span className="text-accent-dark font-black tracking-widest text-[10px]">AI_Timeline_Sync</span>
        </div>
        {logs.map((log, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1 - i * 0.12, x: 0 }}
            key={`${log.year}-${i}`}
            className="flex items-center gap-2"
          >
            <span className="text-[9px] font-black text-cyan-800">{`[${log.year}]`}</span>
            <span className={i === 0 ? 'text-slate-950 font-bold' : 'text-slate-600 font-medium'}>{log.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
