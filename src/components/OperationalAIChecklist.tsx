import { motion } from 'motion/react';
import { Bot, Check, ArrowRight } from 'lucide-react';
import { useVulnerability } from '../context/VulnerabilityContext';
import { track } from '../lib/analytics';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  impactText: string;
}

const OPERATIONAL_ITEMS: ChecklistItem[] = [
  {
    id: 'op-1',
    category: 'Automação & Processos',
    label: 'Automatizo tarefas repetitivas e rotinas diárias com IA.',
    impactText: '-12% Vulnerabilidade',
  },
  {
    id: 'op-2',
    category: 'Vendas & Prospecção',
    label: 'Uso IA para prospectar e qualificar leads.',
    impactText: '-12% Vulnerabilidade',
  },
  {
    id: 'op-3',
    category: 'Marketing & Conteúdo',
    label: 'Produzo conteúdo e copy em escala com IA.',
    impactText: '-12% Vulnerabilidade',
  },
  {
    id: 'op-4',
    category: 'Atendimento & Suporte 24/7',
    label: 'Tenho agente respondendo e agendando 24/7.',
    impactText: '-12% Vulnerabilidade',
  },
  {
    id: 'op-5',
    category: 'Inteligência Estratégica',
    label: 'Uso IA para analisar métricas e decidir.',
    impactText: '-12% Vulnerabilidade',
  },
];

interface OperationalAIChecklistProps {
  onWantStrategy?: () => void;
}

export default function OperationalAIChecklist({ onWantStrategy }: OperationalAIChecklistProps) {
  const { operationalAIChecks, toggleOperationalAICheck, vulnerabilityIndex, assessed, hasNoWebsite } =
    useVulnerability();

  const checkedCount = operationalAIChecks.filter(Boolean).length;
  // Enquanto nada foi respondido nao existe veredito — 100% antes da primeira
  // pergunta e acusacao, nao diagnostico.
  const score = assessed && vulnerabilityIndex !== null ? vulnerabilityIndex : null;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-8 md:py-16">
      <div className="premium-glass rounded-[2rem] border border-slate-200/80 p-6 md:p-14 bg-white/95 shadow-xl relative overflow-hidden">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Bot size={14} className="text-cyan-700" />
            <span className="text-cyan-800 text-xs font-black uppercase tracking-[0.2em]">
              Checklist de IA operacional
            </span>
          </div>
          <h2 className="text-2xl md:text-5xl font-serif text-slate-900 mb-3">
            Sua empresa usa IA na prática ou <span className="italic font-normal text-slate-500">apenas como curiosidade?</span>
          </h2>
          <p className="text-slate-600 text-xs md:text-sm max-w-xl mx-auto font-light">
            Marque o que sua operação já executa no dia a dia. Cada processo ativado protege sua empresa contra a concorrência.
          </p>
        </div>

        {/* Duas colunas a partir de lg: com uma coluna so, o capitulo passava de
            1,7 viewport e o banner de resultado — o pagamento da interacao —
            ficava abaixo da dobra. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto mb-6 md:mb-8">
          {OPERATIONAL_ITEMS.map((item, index) => {
            const isChecked = operationalAIChecks[index];
            return (
              <motion.div
                key={item.id}
                onClick={() => { toggleOperationalAICheck(index); track('operational_check', { kind: 'pillar', index }); }}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className={`p-3.5 md:p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 ${
                  isChecked
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check size={16} strokeWidth={3} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-800 block mb-0.5">
                      {item.category}
                    </span>
                    <p className={`text-xs md:text-sm font-semibold leading-snug ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                  </div>
                </div>

                {/* No mobile a pilha completa espremia o rotulo em 6 linhas.
                    Ali basta o numero; o texto por extenso volta a partir de sm. */}
                <span
                  className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap border shrink-0 ${
                    isChecked
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200/60 text-slate-600 border-slate-300'
                  }`}
                >
                  <span className="sm:hidden">{isChecked ? '✓ -12%' : '-12%'}</span>
                  <span className="hidden sm:inline">{isChecked ? '✓ Ativado (-12%)' : item.impactText}</span>
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Resultado consolidado — so aparece depois da primeira resposta. */}
        <div
          className={`p-5 md:p-8 rounded-2xl border transition-all duration-500 ${
            score === null
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : hasNoWebsite
                ? 'bg-red-50 border-red-300 text-red-950'
                : score > 60
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : score > 35
                    ? 'bg-cyan-50/90 border-cyan-300 text-cyan-950'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
            <div className="flex items-center gap-4 md:gap-5 text-left">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 font-serif text-xl md:text-2xl font-black border-2 bg-white shadow-md ${
                  score === null
                    ? 'border-slate-300 text-slate-400'
                    : hasNoWebsite || score > 60
                      ? 'border-red-500 text-red-600'
                      : score > 35
                        ? 'border-amber-500 text-amber-600'
                        : 'border-emerald-500 text-emerald-600'
                }`}
              >
                {score === null ? '--' : `${score}%`}
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block mb-1">
                  Seu resultado consolidado
                </span>
                <h4 className="text-base md:text-xl font-bold font-serif mb-1">
                  {score === null
                    ? 'Marque um pilar para calcular seu índice'
                    : hasNoWebsite
                      ? 'Risco crítico de invisibilidade digital'
                      : score > 60
                        ? 'Alta vulnerabilidade — a operação ainda é manual'
                        : score > 35
                          ? 'Vulnerabilidade moderada — janela de adaptação aberta'
                          : 'Vanguarda — a base de IA já está no lugar'}
                </h4>
                <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                  {score === null
                    ? 'O índice mede o que sua operação já executa, não o que você concorda. Nada é calculado antes da sua primeira resposta.'
                    : hasNoWebsite
                      ? 'Sem site estruturado, nenhuma outra alavanca de IA consegue ser encontrada pelos clientes.'
                      : score > 60
                        ? `Você ativou ${checkedCount} de 5 pilares operacionais. Cada pilar que falta é trabalho que hoje consome hora de gente.`
                        : score > 35
                          ? `${checkedCount} de 5 pilares ativos. Faltam agentes autônomos para as rotinas que ainda dependem de alguém lembrar.`
                          : `${checkedCount} de 5 pilares ativos. O próximo passo é integração entre eles — agentes que conversam, não ilhas.`}
                </p>
              </div>
            </div>

            <button
              onClick={() => { track('cta_click', { location: 'operational_checklist', score: score ?? -1 }); onWantStrategy?.(); }}
              className="px-6 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent active:scale-95 transition-all flex items-center gap-2 shadow-lg shrink-0 w-full md:w-auto justify-center"
            >
              <span>{score !== null && score <= 35 ? 'Escalar agentes autônomos' : 'Ver a proposta da RIA'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
