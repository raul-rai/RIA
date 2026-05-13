import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export default function EliteHUD({ activeScene = 0 }: { activeScene?: number }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [threatLevel, setThreatLevel] = useState(14);
  const [logs, setLogs] = useState<{year: string, text: string}[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const aiHistory = [
      { year: "1950", text: "ALAN_TURING" },
      { year: "1997", text: "DEEP_BLUE" },
      { year: "2014", text: "ALPHA_GO" },
      { year: "2018", text: "ATTENTION_IS_ALL_YOU_NEED" },
      { year: "2022", text: "CHAT_GPT" },
      { year: "2025", text: "LLM_MASS_EXPANSION" },
      { year: "2026", text: "SUA_EMPRESA_OTIMIZADA?" }
    ];

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const pushNextLog = () => {
      if (currentIndex < aiHistory.length) {
        const logToPush = aiHistory[currentIndex];
        setLogs(prev => {
          return [logToPush, ...prev].slice(0, 7);
        });
        currentIndex++;
        
        // Exponentially decreasing delay (2500 -> 1625 -> 1056 -> 686 -> 446 -> 290)
        const nextDelay = 2500 * Math.pow(0.65, currentIndex - 1);
        timeoutId = setTimeout(pushNextLog, Math.max(nextDelay, 300));
      }
    };

    timeoutId = setTimeout(pushNextLog, 1500);

    const threatInterval = setInterval(() => {
      setThreatLevel(prev => Math.min(99, Math.max(10, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
      clearInterval(threatInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] font-mono uppercase text-[9px] tracking-[0.2em] text-accent/40 overflow-hidden">


      {/* Top Right: AI Threat Level - Hidden on Mobile */}
      <div className="hidden md:flex absolute top-6 right-6 md:top-8 md:right-8 flex-col items-end gap-1 md:gap-2 text-right">
        <span className="text-white/60 text-[9px]">Vulnerability Index</span>
        <div className="flex items-end gap-1 h-6 md:h-8">
          {[...Array(isMobile ? 5 : 10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: `${Math.random() * 100}%`,
                backgroundColor: i > (isMobile ? 3 : 7) ? 'rgba(255,0,0,0.4)' : 'rgba(0,229,255,0.2)'
              }}
              className="w-0.5 md:w-1 bg-accent/20"
            />
          ))}
        </div>
        <div className="text-xl md:text-3xl font-serif italic text-white/80 leading-none">{threatLevel}%</div>
      </div>

      {/* Bottom Left: Live Terminal Data - Desktop Only */}
      <div 
        className="hidden md:flex absolute bottom-8 left-8 flex-col gap-2 max-w-[250px] transition-opacity duration-1000"
        style={{ opacity: activeScene === 0 ? 1 : 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-[1px] bg-accent" />
          <span className="text-accent/60">AI_Timeline_Sync</span>
        </div>
        {logs.map((log, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1 - (i * 0.15), x: 0 }}
            key={`${log.year}-${i}`}
            className="flex items-center gap-2"
          >
            <span className="text-[9px] font-bold text-accent/50">{`[${log.year}]`}</span>
            <span className={i === 0 ? "text-white/80 font-bold" : "text-white/40"}>{log.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom Right: Corner Frame Decor - Hidden on Mobile */}
      <div className="hidden md:block absolute bottom-8 right-8 w-24 h-24 border-r border-b border-white/10">
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-accent/5" />
        <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-accent" />
        <div className="absolute bottom-4 right-4 flex flex-col items-end opacity-20">
          <span>RIA_ELITE_v4.2</span>
          <span>SECURED_PROTOCOL</span>
        </div>
      </div>

      {/* Ambient Grid Artifacts */}
      <div className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,229,255,1) 1px, transparent 0)', backgroundSize: '60px 60px md:backgroundSize: 100px 100px' }} />
      </div>
    </div>
  );
}
