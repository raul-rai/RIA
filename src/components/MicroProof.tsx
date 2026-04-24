import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Cpu, Zap, Search } from 'lucide-react';

interface MicroProofProps {
  type: 'market' | 'agent' | 'security' | 'scan';
  className?: string;
}

export default function MicroProof({ type, className = "" }: MicroProofProps) {
  const [data, setData] = useState<string>("");
  
  useEffect(() => {
    const intervals: Record<string, string[]> = {
      market: ["Analizando S&P 500...", "Vulnerabilidade Detectada: Setor Varejo", "Oportunidade: Automação SDR", "IA Adoption: +12% MoM"],
      agent: ["Agente SDR-04: Online", "Lead Qualificado: High Intent", "Reunião Agendada: 14:00", "Follow-up enviado via AI"],
      security: ["Criptografia AES-256: Ativa", "Firewall Neural: Estável", "Deepfake Detection: 99.9%", "Data Sovereignty: Confirmed"],
      scan: ["Scanning Workforce Efficiency...", "Ineficiência Humana: 64%", "Potencial de Alavancagem: 8.4x", "Risk Level: CRITICAL"]
    };

    const currentLogs = intervals[type];
    let i = 0;
    
    const interval = setInterval(() => {
      setData(currentLogs[i]);
      i = (i + 1) % currentLogs.length;
    }, 3000);

    setData(currentLogs[0]);
    return () => clearInterval(interval);
  }, [type]);

  const icons = {
    market: <Activity size={14} className="text-accent" />,
    agent: <Zap size={14} className="text-accent" />,
    security: <Shield size={14} className="text-accent" />,
    scan: <Search size={14} className="text-accent" />
  };

  return (
    <div className={`pointer-events-none ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={data}
          initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
          className="flex items-center gap-3 px-4 py-2 rounded-lg border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl"
        >
          <div className="animate-pulse-subtle">
            {icons[type]}
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">System_Log</span>
            <span className="text-[10px] text-white/70 font-mono tracking-tight">{data}</span>
          </div>
          <div className="ml-4 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-accent/30" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
