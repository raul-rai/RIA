import { motion } from 'motion/react';
import { ArrowRight, Ruler, Timer, Target, LineChart, Hammer } from 'lucide-react';
import { CASES } from '../content/cases';
import { track } from '../lib/analytics';

interface ProofSectionProps {
  onWantStrategy?: () => void;
}

/** Como a RIA mede retorno. Verificavel, e por isso pode ir ao ar sem cliente. */
const METHOD = [
  { icon: Ruler, title: 'Medimos antes', body: 'Horas e volume da rotina, por 30 dias, no seu sistema.' },
  { icon: Target, title: 'Um gargalo por vez', body: 'A primeira entrega ataca o de maior custo por hora.' },
  { icon: Timer, title: 'Prazo na proposta', body: 'Não entrou em produção na data? A etapa não é cobrada.' },
  { icon: LineChart, title: 'Medimos depois', body: 'Mesmo indicador, mesma fonte. O número é seu.' },
];

export default function ProofSection({ onWantStrategy }: ProofSectionProps) {
  const hasCases = CASES.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-10 pointer-events-auto">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-3">
          <LineChart size={14} className="text-accent" />
          <span className="text-accent-dark text-[10px] md:text-xs uppercase tracking-[0.2em] font-black">
            {hasCases ? 'Onde a RIA já esteve' : 'Como medimos'}
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-slate-900 leading-tight">
          {hasCases ? (
            <>
              Clientes reais, <span className="italic font-normal text-slate-500">não folheto.</span>
            </>
          ) : (
            <>
              Retorno que você <span className="italic font-normal text-slate-500">consegue auditar.</span>
            </>
          )}
        </h2>
      </div>

      {hasCases && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-8 md:mb-10">
          {CASES.map((c, i) => (
            <motion.article
              key={c.segment}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-md flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2">
                {c.kind === 'entrega' ? (
                  <Hammer size={12} className="text-slate-400 shrink-0" />
                ) : (
                  <LineChart size={12} className="text-accent shrink-0" />
                )}
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 font-bold">
                  {c.segment}
                </span>
              </div>

              <p className="text-lg md:text-xl font-serif text-slate-900 leading-tight">{c.headline}</p>

              <dl className="text-xs text-slate-600 leading-relaxed flex flex-col gap-1.5 mt-1">
                <div>
                  <dt className="inline font-bold text-slate-800">Antes: </dt>
                  <dd className="inline">{c.before}</dd>
                </div>
                <div>
                  <dt className="inline font-bold text-slate-800">O que fizemos: </dt>
                  <dd className="inline">{c.intervention}</dd>
                </div>
                <div>
                  <dt className="inline font-bold text-slate-800">Prazo: </dt>
                  <dd className="inline">{c.timeframe}</dd>
                </div>
              </dl>

              {/* Linha de apuracao so existe quando ha apuracao. Sem measurement
                  o cartao fica em silencio em vez de simular rigor. */}
              {c.measurement && (
                <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 mt-auto">
                  <span className="font-bold uppercase tracking-wider">Apuração:</span> {c.measurement}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      )}

      {/* O metodo continua na pagina mesmo com casos: os casos dizem onde a RIA
          esteve, o metodo diz como o resultado DESTE visitante sera medido. */}
      <div className={hasCases ? 'border-t border-slate-200/80 pt-6 md:pt-8' : ''}>
        {hasCases && (
          <h3 className="text-center text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-slate-700 mb-5">
            E o seu, como vai ser medido
          </h3>
        )}
        <div className={`grid grid-cols-2 ${hasCases ? 'lg:grid-cols-4 gap-3' : 'sm:grid-cols-2 gap-3 md:gap-5'}`}>
          {METHOD.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex ${
                  hasCases ? 'flex-col gap-1.5 p-4' : 'gap-4 p-5 md:p-6 shadow-md'
                }`}
              >
                <div className={`p-2 bg-accent/10 border border-accent/20 rounded-lg h-fit w-fit shrink-0`}>
                  <Icon size={14} className="text-accent" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900 mb-0.5 font-serif">{m.title}</h4>
                  <p className="text-[11px] md:text-xs text-slate-600 leading-snug">{m.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-6 md:mt-8">
        <button
          onClick={() => { track('cta_click', { location: 'proof' }); onWantStrategy?.(); }}
          className="px-6 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent active:scale-95 transition-all inline-flex items-center gap-2 shadow-lg"
        >
          <span>Ver a proposta</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
