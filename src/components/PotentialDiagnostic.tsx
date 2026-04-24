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
    <div className="w-full max-w-5xl mx-auto px-4 py-24 pointer-events-auto">
      <div className="premium-glass rounded-[2.5rem] border border-white/10 p-8 md:p-16 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 blur-[120px]" />
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Search size={12} className="text-accent" />
            <span className="text-accent text-[9px] font-black uppercase tracking-[0.3em]">Health Check Digital</span>
          </div>
          <h2 className="heading-section text-white mb-4">
            Seu site sobrevive ao <br />
            <span className="italic font-normal text-white/50">escrutínio da nova era?</span>
          </h2>
          <p className="text-white/40 text-sm max-w-xl mx-auto font-light leading-relaxed">
            Não basta estar no Google. Seu site precisa ser legível para IAs e instantâneo para humanos. Analise sua saúde técnica em segundos.
          </p>
        </div>

        {!result ? (
          <div className="max-w-2xl mx-auto">
            <div className="relative flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="relative flex-1">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/40" size={18} />
                <input 
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="insira-seu-dominio.com.br"
                  className="w-full bg-transparent py-4 pl-14 pr-4 text-white focus:outline-none text-sm placeholder:text-white/20"
                />
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url}
                className="px-10 py-4 bg-accent text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.2)]"
              >
                {isAnalyzing ? <Search size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>Iniciar Varredura</span>
              </button>
            </div>

            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10">
                <div className="flex justify-between text-[8px] uppercase tracking-[0.4em] text-white/40 mb-3 font-black">
                  <span>Varredura Técnica em Curso</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
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
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {result.metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <Icon size={16} className={m.score < 50 ? "text-red-400" : "text-accent"} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      m.score < 50 ? "text-red-400/60" : "text-accent/60"
                    }`}>{m.status}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-serif text-white mb-1">{m.score}%</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">{m.name}</div>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-auto">
                    <div 
                      className={`h-full ${m.score < 50 ? "bg-red-400" : "bg-accent"}`} 
                      style={{ width: `${m.score}%` }} 
                    />
                  </div>
                </div>
              );
            })}
            
            <div className="md:col-span-4 mt-8 p-6 bg-accent/5 border border-accent/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-red-400/20 flex items-center justify-center text-red-400 font-serif text-2xl">
                  {result.totalScore}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-1">Diagnóstico Final: <span className="text-red-400">Ineficiente</span></h4>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Sua presença digital atual não está preparada para agentes de IA.</p>
                </div>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="w-full md:w-auto px-8 py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-3"
              >
                <span>Corrigir minha estrutura</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
