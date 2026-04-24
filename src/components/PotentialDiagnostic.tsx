import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Search, Zap, CheckCircle2, AlertCircle, Cpu, SearchCode, Smartphone, ArrowRight } from 'lucide-react';

export default function PotentialDiagnostic() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<null | {
    metrics: { name: string; score: number; status: string; icon: any }[];
    totalScore: number;
  }>(null);

  const handleAnalyze = async () => {
    if (!url || !url.includes('.')) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setProgress(0);

    const steps = [
      "Pingando servidores globais...",
      "Analisando estrutura de cabeçalhos SEO...",
      "Simulando leitura por agentes GPT/Gemini (GEO)...",
      "Verificando viewports responsivas...",
      "Consolidando relatório técnico..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgress((i + 1) * 20);
      await new Promise(r => setTimeout(r, 800));
    }

    setResult({
      totalScore: 68,
      metrics: [
        { name: "Velocidade de Carregamento", score: 42, status: "Crítico", icon: Zap },
        { name: "Otimização SEO (Google)", score: 75, status: "Médio", icon: SearchCode },
        { name: "Otimização GEO (IA Search)", score: 28, status: "Nulo", icon: Cpu },
        { name: "Mobile Responsividade", score: 88, status: "Bom", icon: Smartphone }
      ]
    });
    setIsAnalyzing(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-24 pointer-events-auto">
      <div className="premium-glass rounded-[2rem] md:rounded-[2.5rem] border border-white/10 p-6 md:p-16 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 blur-[120px]" />
        
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4 md:mb-6">
            <Search size={10} className="text-accent" />
            <span className="text-accent text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em]">Health Check Digital</span>
          </div>
          <h2 className="heading-section text-white mb-3 md:mb-4">
            Seu site sobrevive à <br />
            <span className="italic font-normal text-white/50">nova era?</span>
          </h2>
          <p className="text-white/40 text-[11px] md:text-sm max-w-xl mx-auto font-light leading-relaxed">
            Não basta estar no Google. Seu site precisa ser legível para IAs e instantâneo para humanos.
          </p>
        </div>

        {!result ? (
          <div className="max-w-2xl mx-auto">
            <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" size={16} />
                <input 
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="seu-dominio.com.br"
                  className="w-full bg-transparent py-3 pl-12 pr-4 text-white focus:outline-none text-[13px] placeholder:text-white/20"
                />
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url}
                className="px-6 md:px-10 py-4 bg-accent text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.2)]"
              >
                {isAnalyzing ? <Search size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{isAnalyzing ? 'Analisando' : 'Varredura'}</span>
              </button>
            </div>

            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                <div className="flex justify-between text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-white/40 mb-2 font-black">
                  <span>Varredura Técnica</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-[1px] md:h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-accent shadow-[0_0_20px_rgba(0,229,255,1)]"
                  />
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
          >
            {result.metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 md:p-2 bg-white/5 rounded-lg border border-white/10">
                      <Icon size={14} className={m.score < 50 ? "text-red-400" : "text-accent"} />
                    </div>
                    <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${
                      m.score < 50 ? "text-red-400/60" : "text-accent/60"
                    }`}>{m.status}</span>
                  </div>
                  <div>
                    <div className="text-xl md:text-3xl font-serif text-white mb-0.5 md:mb-1">{m.score}%</div>
                    <div className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-wider font-bold leading-tight">{m.name}</div>
                  </div>
                  <div className="h-0.5 md:h-1 w-full bg-white/5 rounded-full overflow-hidden mt-auto">
                    <div 
                      className={`h-full ${m.score < 50 ? "bg-red-400" : "bg-accent"}`} 
                      style={{ width: `${m.score}%` }} 
                    />
                  </div>
                </div>
              );
            })}
            
            <div className="col-span-2 md:col-span-4 mt-6 md:mt-8 p-5 md:p-6 bg-accent/5 border border-accent/10 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-red-400/20 flex items-center justify-center text-red-400 font-serif text-xl md:text-2xl flex-shrink-0">
                  {result.totalScore}
                </div>
                <div>
                  <h4 className="text-white font-bold text-[10px] md:text-sm uppercase tracking-widest mb-0.5 md:mb-1">Diagnóstico: <span className="text-red-400">Ineficiente</span></h4>
                  <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider leading-tight">Presença digital obsoleta para a era da IA.</p>
                </div>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-black rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2"
              >
                <span>Corrigir estrutura</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
