import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export default function EliteHUD() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [threatLevel, setThreatLevel] = useState(14);
  const [logs, setLogs] = useState<string[]>([]);
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

    const logPool = [
      "ENCRYPT_SIGNAL_ACTIVE",
      "CORE_PROCESSING_01_STABLE",
      "MARKET_VULNERABILITY_SCAN",
      "NEURAL_LINK_ESTABLISHED",
      "ASYNC_DATA_FETCH_COMPLETED",
      "ROI_MULTIPLIER_CALCULATED",
      "HEADCOUNT_INEFFICIENCY_DETECTED"
    ];

    const interval = setInterval(() => {
      setLogs(prev => [logPool[Math.floor(Math.random() * logPool.length)], ...prev].slice(0, 5));
      setThreatLevel(prev => Math.min(99, Math.max(10, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] font-mono uppercase text-[9px] tracking-[0.2em] text-accent/40 overflow-hidden">
      {/* Top Left: System Status */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent animate-pulse rounded-full shadow-[0_0_10px_rgba(0,229,255,1)]" />
            <span className="text-white/60 text-[8px] md:text-[9px]">Status: <span className="text-accent">Operational</span></span>
          </div>
          <div className="hidden md:block text-[7px] text-white/20 ml-5 tracking-[0.4em]">RIA_CORE_v4.2.0</div>
        </div>

        <div className="hidden md:flex flex-col gap-3 border-l border-accent/20 pl-4">
          <div className="flex flex-col">
            <span className="text-white/40 text-[9px] mb-1 uppercase tracking-tighter">Agentes em Operação</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white/80 text-xs font-serif italic">14</span>
              <span className="text-accent/40 text-[6px] tracking-tighter">AGENT_UPLINK</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white/40 text-[9px] mb-1 uppercase tracking-tighter">Automações Ativas (24h)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white/80 text-xs font-serif italic">1.294</span>
              <span className="text-accent/60 text-[8px] tracking-tighter">SYNC_COMPLETED</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-1 opacity-20 pl-4">
          <div>COORD_X: {coords.x}</div>
          <div>COORD_Y: {coords.y}</div>
        </div>
      </div>

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
      <div className="hidden md:flex absolute bottom-8 left-8 flex flex-col gap-2 max-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-[1px] bg-accent" />
          <span className="text-accent/60">Live_Stream</span>
        </div>
        {logs.map((log, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1 - (i * 0.2), x: 0 }}
            key={`${log}-${i}`}
            className="flex items-center gap-2"
          >
            <span className="text-[7px] text-accent/30">{`[${new Date().toLocaleTimeString()}]`}</span>
            <span className={i === 0 ? "text-white/60" : "text-white/20"}>{log}</span>
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
