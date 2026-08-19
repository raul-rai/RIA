import { motion } from 'motion/react';
import { LineChart, Ruler, Target, Timer, Hammer, Check, ArrowUpRight, Award } from 'lucide-react';
import { CASES } from '../content/cases';
import { FRONTS } from '../content/fronts';
import { CONSULTANT, PHOTO_SRC, PHOTO_ALT } from '../content/consultant';
import { track } from '../lib/analytics';
import { useAgentIntent } from '../context/AgentIntentContext';

/**
 * Dobra 4 — a prova e quem executa, na mesma dobra.
 *
 * Estavam separadas em ProofSection e ConsultantSection. Para consultor solo
 * sao a mesma prova: nao adianta o caso funcionar se o visitante nao sabe quem
 * fez, nem adianta a credencial sem caso. Cada caso entra etiquetado com a
 * frente que prova — e essa etiqueta que costura esta dobra com a dobra 3.
 */

const METHOD = [
  { icon: Ruler, title: 'Medimos antes', body: 'Horas e volume da rotina, por 30 dias, no seu sistema.' },
  { icon: Target, title: 'Um gargalo por vez', body: 'A primeira entrega ataca o de maior custo por hora.' },
  { icon: Timer, title: 'Prazo na proposta', body: 'Não entrou em produção na data? A etapa não é cobrada.' },
  { icon: LineChart, title: 'Medimos depois', body: 'Mesmo indicador, mesma fonte. O número é seu.' },
];

const frontTag = (id: number) => FRONTS.find((f) => f.id === id)?.tag ?? '';

export default function CredibilitySection() {
  const { requestIntent } = useAgentIntent();
  return (
    <div className="w-full max-w-6xl mx-auto px-4 flex flex-col justify-center pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        <div className="glass-chip glass-accent inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3">
          <LineChart size={14} className="text-accent" />
          <span className="text-accent-dark text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            Já atravessei isso com outros
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 leading-tight reading-surface glass-md-none inline-block px-4 py-2">
          Cada frente, <span className="italic font-normal text-slate-500">com um caso atrás.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8">
        {CASES.map((c, i) => (
          <motion.article
            key={c.segment}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card glass-hover rounded-2xl p-5 flex flex-col gap-2 text-left"
          >
            <div className="flex items-center gap-1.5">
              {c.kind === 'entrega' ? (
                <Hammer size={12} className="text-slate-400 shrink-0" />
              ) : (
                <LineChart size={12} className="text-accent shrink-0" />
              )}
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold">
                {c.segment}
              </span>
            </div>

            <span className="glass-inset glass-accent self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-accent-dark">
              Prova a frente {c.front} · {frontTag(c.front)}
            </span>

            <p className="text-lg md:text-xl font-serif text-slate-900 leading-tight">{c.headline}</p>

            <dl className="text-xs text-slate-600 leading-relaxed flex flex-col gap-1.5 mt-1">
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Antes</dt>
                <dd>{c.before}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">O que entrou</dt>
                <dd>{c.intervention}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Prazo</dt>
                <dd>{c.timeframe}</dd>
              </div>
            </dl>

            {c.measurement && (
              <p className="text-[11px] text-slate-500 border-t border-slate-900/10 pt-2.5 mt-auto">
                {c.measurement}
              </p>
            )}
          </motion.article>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-center text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-slate-700 mb-5">
          E o número dá para auditar
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METHOD.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="glass-card rounded-2xl p-4 flex flex-col gap-1.5 text-left"
              >
                <Icon size={14} className="text-accent" />
                <h4 className="text-xs md:text-sm font-bold text-slate-900 font-serif">{m.title}</h4>
                <p className="text-[11px] md:text-xs text-slate-600 leading-snug">{m.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
          <div className="mx-auto md:mx-0">
            {PHOTO_SRC ? (
              <img
                src={PHOTO_SRC}
                alt={PHOTO_ALT}
                loading="lazy"
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border border-slate-200 shadow-lg"
              />
            ) : (
              <div className="glass-inset w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center">
                <span className="font-serif text-3xl text-slate-400">RV</span>
              </div>
            )}
          </div>

          <div className="flex flex-col text-center md:text-left">
            <div className="glass-inset inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 w-fit mx-auto md:mx-0">
              <Award size={12} className="text-accent" />
              <span className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                Quem executa
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-serif text-slate-900 mb-1 leading-tight">
              {CONSULTANT.name}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm italic mb-3">{CONSULTANT.role}</p>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-4 max-w-xl mx-auto md:mx-0">
              {CONSULTANT.bio}
            </p>

            <ul className="flex flex-col gap-2 mb-5 text-left max-w-xl mx-auto md:mx-0">
              {CONSULTANT.credentials.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Check size={14} className="text-accent shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="leading-snug">{c}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => {
                  track('cta_click', { location: 'credibility' });
                  requestIntent('credibility');
                }}
                className="px-6 py-3.5 w-full md:w-auto bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
              >
                Falar com o agente <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
