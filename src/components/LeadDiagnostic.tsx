import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Terminal, ChevronRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LeadDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const STEPS = [
  {
    id: 'niche',
    question: '> IDENTIFIQUE O SETOR DE OPERAÇÃO:',
    options: ['E-commerce / Varejo', 'Serviços / Consultoria', 'Indústria / Logística', 'Educação / Infoproduto'],
  },
  {
    id: 'pain',
    question: '> QUAL O MAIOR GARGALO ATUAL?',
    options: ['Atendimento Lento', 'Custo de Vendas (CAC) Alto', 'Processos Manuais', 'Falta de Dados'],
  },
  {
    id: 'revenue',
    question: '> FAIXA DE FATURAMENTO MENSAL:',
    options: ['R$ 100k - R$ 500k', 'R$ 500k - R$ 1M', 'R$ 1M - R$ 5M', 'Acima de R$ 5M'],
  }
];

export default function LeadDiagnostic({ isOpen, onClose, onComplete }: LeadDiagnosticProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleSelect = (option: string) => {
    const step = STEPS[currentStep];
    setAnswers(prev => ({ ...prev, [step.id]: option }));
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      startAnalysis();
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    const analysisLogs = [
      "Iniciando varredura de processos...",
      "Identificando ineficiências latentes...",
      "Mapeando pontos de alavancagem via Agentes...",
      "Calculando ROI projetado (24/7 Ops)...",
      "Gerando Plano de Defesa personalizado..."
    ];

    analysisLogs.forEach((log, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
        if (i === analysisLogs.length - 1) {
          setTimeout(() => {
            onComplete({ ...answers, logs: analysisLogs });
          }, 1000);
        }
      }, i * 800);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl premium-glass rounded-2xl border border-accent/30 overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.2)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <Terminal size={18} className="text-accent" />
                <span className="text-white/60 font-mono text-xs uppercase tracking-widest">RIA_DIAGNOSTIC_v1.0.4</span>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 min-h-[400px] flex flex-col">
              {!isAnalyzing ? (
                <>
                  <div className="mb-8">
                    <div className="flex gap-2 mb-4">
                      {STEPS.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                            i <= currentStep ? 'bg-accent' : 'bg-white/10'
                          }`} 
                        />
                      ))}
                    </div>
                    <motion.h3 
                      key={currentStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-white font-mono text-lg"
                    >
                      {STEPS[currentStep].question}
                    </motion.h3>
                  </div>

                  <div className="grid gap-3">
                    {STEPS[currentStep].options.map((option, i) => (
                      <motion.button
                        key={option}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleSelect(option)}
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:border-accent/50 hover:bg-accent/5 transition-all text-left"
                      >
                        <span className="text-white/70 group-hover:text-white font-sans">{option}</span>
                        <ChevronRight size={16} className="text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 flex-1">
                  <div className="relative mb-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-2 border-accent/20 border-t-accent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="text-accent animate-spin" size={24} />
                    </div>
                  </div>
                  
                  <div className="w-full max-w-xs space-y-3">
                    {logs.map((log, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className="flex items-center gap-3 text-xs font-mono text-accent/60"
                      >
                        <CheckCircle2 size={12} className="text-accent" />
                        <span>{log}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-accent/5 border-t border-white/5 flex items-center gap-3">
              <AlertTriangle size={14} className="text-accent/40" />
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Criptografia de ponta a ponta ativa</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
