import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, ChevronRight, Loader2, TrendingUp, DollarSign, Zap, ArrowRight, MessageSquare } from 'lucide-react';

interface ExperienceRIAProps {
  onFinalContact: (data: any) => void;
}

type Step = 'START' | 'DIAGNOSTIC' | 'ANALYZING' | 'ROI' | 'FINAL';

const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'niche',
    question: '> IDENTIFIQUE O SETOR:',
    options: ['E-commerce', 'SaaS / Tech', 'Serviços B2B', 'Educação'],
  },
  {
    id: 'team_size',
    question: '> TAMANHO DA EQUIPE COMERCIAL/CS:',
    options: ['1 - 3 pessoas', '4 - 10 pessoas', '11 - 30 pessoas', '30+ pessoas'],
    values: [2, 7, 20, 50] // used for ROI math
  },
  {
    id: 'revenue',
    question: '> FATURAMENTO MENSAL ATUAL:',
    options: ['R$ 100k - 300k', 'R$ 300k - 1M', 'R$ 1M - 5M', '5M+'],
  }
];

export default function ExperienceRIA({ onFinalContact }: ExperienceRIAProps) {
  const [step, setStep] = useState<Step>('START');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const roiData = useMemo(() => {
    if (!answers.team_size) return null;
    
    const teamSize = answers.team_size_value || 2;
    const avgSalary = 5000; // R$ 5k/mês custo médio funcionário
    const annualHumanCost = teamSize * avgSalary * 12;
    const aiCost = 1500; // Custo mensal médio infra IA
    const annualAiCost = aiCost * 12;
    const savings = annualHumanCost - annualAiCost;
    const efficiencyBoost = 40; // 40% de aumento de produtividade

    return {
      savings: savings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      monthlySavings: (savings / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      efficiency: efficiencyBoost,
      multiplier: (annualHumanCost / annualAiCost).toFixed(1)
    };
  }, [answers]);

  const handleStart = () => setStep('DIAGNOSTIC');

  const handleAnswer = (option: string, value?: any) => {
    const q = DIAGNOSTIC_QUESTIONS[currentQuestion];
    setAnswers(prev => ({ ...prev, [q.id]: option, [`${q.id}_value`]: value }));

    if (currentQuestion < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      startAnalysis();
    }
  };

  const startAnalysis = () => {
    setStep('ANALYZING');
    const simulationLogs = [
      "Interrogando fluxos de trabalho...",
      "Identificando redundâncias humanas...",
      "Mapeando integração de Agentes Autônomos...",
      "Simulando escala infinita (24/7)...",
      "Calculando ROI de alavancagem..."
    ];

    simulationLogs.forEach((log, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
        if (i === simulationLogs.length - 1) {
          setTimeout(() => setStep('ROI'), 800);
        }
      }, i * 600);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'START' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <button
              onClick={handleStart}
              className="group relative px-12 py-6 bg-accent text-black rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(0,229,255,0.4)] flex items-center justify-center gap-3"
            >
              <Zap size={18} className="fill-current" />
              <span>Iniciar Diagnóstico de Alavancagem</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>
        )}

        {step === 'DIAGNOSTIC' && (
          <motion.div
            key="diagnostic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="premium-glass rounded-3xl p-8 md:p-12 border border-accent/20 w-full"
          >
            <div className="flex items-center gap-3 mb-8 opacity-50">
              <Terminal size={16} className="text-accent" />
              <span className="text-[10px] uppercase tracking-widest font-mono">Input Requerido: {currentQuestion + 1}/{DIAGNOSTIC_QUESTIONS.length}</span>
            </div>

            <h3 className="text-white font-mono text-xl mb-8">
              {DIAGNOSTIC_QUESTIONS[currentQuestion].question}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIAGNOSTIC_QUESTIONS[currentQuestion].options.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt, DIAGNOSTIC_QUESTIONS[currentQuestion].values?.[i])}
                  className="group flex items-center justify-between p-5 rounded-xl border border-white/5 bg-white/5 hover:border-accent/40 hover:bg-accent/5 transition-all text-left"
                >
                  <span className="text-white/70 group-hover:text-white">{opt}</span>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'ANALYZING' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="text-accent animate-spin mb-8" size={40} />
            <div className="space-y-3 w-full max-w-xs">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-mono text-accent/60 flex items-center gap-2"
                >
                  <span className="text-accent glitch-text">_</span> {log}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'ROI' && (
          <motion.div
            key="roi"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="premium-glass rounded-3xl p-8 border border-accent/30 bg-accent/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={80} />
              </div>
              <p className="text-accent text-[10px] uppercase tracking-widest font-bold mb-2">Potencial de Economia Anual</p>
              <h4 className="text-4xl md:text-5xl text-white font-serif mb-4 glitch-text">{roiData?.savings}</h4>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Ao substituir processos manuais por Agentes de IA, sua empresa economiza <span className="text-accent font-mono">{roiData?.monthlySavings}/mês</span> em custos operacionais diretos.
              </p>
              
              <div className="space-y-2 border-t border-white/5 pt-6">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-3">Plano de Ataque {answers.niche}:</p>
                {answers.niche === 'E-commerce' && [
                  'Implementar Atendimento 24/7 com IA Transacional',
                  'Automação de Recuperação de Carrinho via Agentes',
                  'Personalização de Ofertas em Tempo Real'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    {item}
                  </div>
                ))}
                {answers.niche !== 'E-commerce' && [
                  'SDRs Digitais para Qualificação Ininterrupta',
                  'Extração de Inteligência de Reuniões e Dados',
                  'Escala de Operações sem Contratações'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-rows-2 gap-6">
              <div className="premium-glass rounded-3xl p-8 border border-white/10 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <TrendingUp className="text-accent" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Aumento de Eficiência</p>
                  <p className="text-2xl text-white font-mono">+{roiData?.efficiency}%</p>
                </div>
              </div>
              <div className="premium-glass rounded-3xl p-8 border border-white/10 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <DollarSign className="text-accent" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Multiplicador de Capital</p>
                  <p className="text-2xl text-white font-mono">{roiData?.multiplier}x mais barato</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col items-center mt-4">
              <button
                onClick={() => onFinalContact({ ...answers, roi: roiData })}
                className="w-full sm:w-auto group px-12 py-6 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 hover:bg-accent flex items-center justify-center gap-3"
              >
                <MessageSquare size={18} />
                <span>Agendar Sessão e Reivindicar ROI</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <p className="mt-4 text-[9px] text-white/20 uppercase tracking-[0.3em]">Cálculo baseado em métricas de mercado para {answers.niche}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
