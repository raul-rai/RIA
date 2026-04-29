import { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Search, Zap, Cpu, Smartphone, ArrowRight } from 'lucide-react';

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
      "Pingando servidores...",
      "Simulando leitura por IAs...",
      "Relatório técnico..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgress((i + 1) * 33);
      await new Promise(r => setTimeout(r, 600));
    }

    setResult({
      totalScore: 68,
      metrics: [
        { name: "Velocidade", score: 42, status: "Crítico", icon: Zap },
        { name: "SEO IA", score: 28, status: "Nulo", icon: Cpu },
        { name: "Mobile", score: 88, status: "Bom", icon: Smartphone }
      ]
    });
    setIsAnalyzing(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 py-4 md:py-24 pointer-events-auto">
      <div className="premium-glass rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 p-4 md:p-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 blur-[120px]" />
        
        <div className="text-center mb-4 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-2 md:mb-6">
            <Search size={12} className="text-accent" />
            <span className="text-accent text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Health Check Digital</span>
          </div>
          <h2 className="text-xl md:text-5xl font-serif text-white mb-1 md:mb-4">
            Seu site sobrevive à <span className="italic font-normal text-white/50">nova era?</span>
          </h2>
          <p className="text-white/60 text-xs md:text-sm max-w-xl mx-auto font-light leading-tight">
            Não basta estar no Google. Seu site precisa ser legível para IAs.
          </p>
        </div>

        {!result ? (
          <div className="max-w-2xl mx-auto">
            <div className="relative flex flex-col md:flex-row gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" size={14} />
                <input 
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="seu-dominio.com.br"
                  className="w-full bg-transparent py-3 pl-10 pr-4 text-white focus:outline-none text-base md:text-sm placeholder:text-white/40"
                />
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url}
                className="px-6 py-4 md:py-3 bg-accent text-black rounded-lg font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Search size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{isAnalyzing ? 'Analisando' : 'Varredura'}</span>
              </button>
            </div>

            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <div className="flex justify-between text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/60 mb-2 font-black">
                  <span>Varredura Técnica</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-[1px] w-full bg-white/5 rounded-full overflow-hidden">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-6"
          >
            {result.metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white/5 rounded-xl p-3 md:p-6 border border-white/5 flex items-center md:flex-col gap-3 md:gap-4">
                  <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 shrink-0">
                    <Icon size={12} className={m.score < 50 ? "text-red-400" : "text-accent"} />
                  </div>
                  <div className="flex-1 md:text-center">
                    <div className="text-xl md:text-3xl font-serif text-white mb-1">{m.score}%</div>
                    <div className="text-[10px] md:text-xs text-white/60 uppercase tracking-wider font-bold">{m.name}</div>
                  </div>
                  <div className="hidden md:block h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${m.score < 50 ? "bg-red-400" : "bg-accent"}`} style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              );
            })}
            
            <div className="col-span-3 mt-4 p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-red-400/20 flex items-center justify-center text-red-400 font-serif text-lg shrink-0">
                  {result.totalScore}
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs md:text-sm uppercase tracking-widest leading-none mb-2">Status: <span className="text-red-400">Ineficiente</span></h4>
                  <p className="text-white/60 text-[10px] md:text-xs uppercase tracking-wider">Site obsoleto para IA Search.</p>
                </div>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="px-5 py-3 bg-white text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2"
              >
                <span>Corrigir</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
