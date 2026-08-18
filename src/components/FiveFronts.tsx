import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Layers, ArrowRight } from 'lucide-react';
import { FRONTS } from '../content/fronts';
import { resolveFirstFront, countChecked } from '../lib/fronts';
import { useVulnerability } from '../context/VulnerabilityContext';
import { track } from '../lib/analytics';

/**
 * Dobra 3 — o catalogo.
 *
 * Substitui o antigo checklist de pilares. A mecanica de marcar continua, o
 * conteudo passa a declarar o que a RIA vende. A frente 1 chega pre-resolvida
 * pelo diagnostico da dobra 2: e a mesma coisa que aquela dobra mediu, e deixar
 * o visitante remarcar do zero era perder a costura entre as duas.
 */
export default function FiveFronts({ onWantStrategy }: { onWantStrategy?: () => void }) {
  const { frontsChecked, toggleFront, hasNoWebsite, websiteScore } = useVulnerability();

  /**
   * A pre-resolucao roda uma vez por veredito do diagnostico. Sem a trava, todo
   * render reescreveria a marcacao e o visitante nao conseguiria discordar do
   * proprio diagnostico — clicar na frente 1 nao teria efeito.
   */
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const verdict = resolveFirstFront({ hasNoWebsite, websiteScore });
    if (verdict === null) return;
    const key = `${hasNoWebsite}:${websiteScore}`;
    if (applied.current === key) return;
    applied.current = key;
    if (frontsChecked[0] !== verdict) toggleFront(0);
  }, [hasNoWebsite, websiteScore, frontsChecked, toggleFront]);

  const marcadas = countChecked(frontsChecked);
  const faltam = FRONTS.length - marcadas;
  const primeiraVazia = resolveFirstFront({ hasNoWebsite, websiteScore }) === false;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col justify-center pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Layers size={14} className="text-cyan-700" />
          <span className="text-cyan-800 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
            As cinco frentes
          </span>
        </div>
        <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-3">
          É aqui que a IA entra <span className="italic font-normal text-slate-500">na sua operação.</span>
        </h2>
        <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Cinco frentes, e é isso que eu faço. Marque as que a sua empresa já cobre — as que sobrarem
          são a pauta da sua sessão.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-4xl mx-auto w-full">
        {FRONTS.map((front, i) => {
          const isChecked = frontsChecked[i];
          const destacada = i === 0 && primeiraVazia && !isChecked;
          return (
            <motion.button
              key={front.id}
              type="button"
              onClick={() => {
                toggleFront(i);
                track('front_toggle', { id: front.id, checked: !isChecked });
              }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={isChecked}
              className={`text-left flex gap-3.5 p-4 rounded-2xl border transition-colors ${
                isChecked
                  ? 'bg-emerald-50/90 border-emerald-300'
                  : destacada
                    ? 'bg-red-50/90 border-red-300'
                    : 'bg-white/90 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center mt-0.5 ${
                  isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}
              >
                {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Frente {front.id}
                </span>
                <span
                  className={`block text-xs md:text-sm font-bold leading-snug mb-1 ${
                    isChecked ? 'text-emerald-950' : 'text-slate-900'
                  }`}
                >
                  {front.label}
                </span>
                <span className="block text-[11px] md:text-xs text-slate-600 leading-snug">
                  {front.promise}
                </span>
                {destacada && (
                  <span className="block mt-2 text-[11px] font-bold text-red-800 leading-snug">
                    {hasNoWebsite
                      ? 'Você acabou de dizer que ainda não tem site. Esta é a primeira.'
                      : `Seu site tirou ${websiteScore}/100 no diagnóstico. Esta é a primeira.`}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center mt-6 md:mt-8">
        <p className="text-sm md:text-base text-slate-800 font-semibold mb-4">
          Você cobre <span className="font-serif text-lg md:text-2xl">{marcadas}</span> de 5.
          {faltam > 0 && (
            <>
              {' '}As {faltam} que faltam são a pauta da sua sessão.
            </>
          )}
        </p>
        <button
          onClick={() => { track('cta_click', { location: 'five_fronts' }); onWantStrategy?.(); }}
          className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg"
        >
          Montar minha pauta <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
