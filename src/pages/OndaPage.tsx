import { useState, useEffect } from 'react';
import DataWave3D from '../components/DataWave3D';

export default function OndaPage() {
  const [waveProgress, setWaveProgress] = useState(0.8); // Start at a dramatic state

  useEffect(() => {
    // Subtle auto-oscillation to keep the wave "alive"
    let startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Oscillation between 0.75 and 0.85
      const newProgress = 0.8 + Math.sin(elapsed * 0.5) * 0.05;
      setWaveProgress(newProgress);
      requestAnimationFrame(animate);
    };
    
    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="bg-[#000408] min-h-screen overflow-hidden">
      {/* Background noise texture for premium feel */}
      <div className="fixed inset-0 z-30 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="fixed top-6 left-6 z-30 pointer-events-none">
        <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">RIA • Isolated Wave</span>
      </div>

      <DataWave3D waveProgress={waveProgress} />
      
      {/* Instructions Overlay */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 text-white/20 text-[10px] uppercase tracking-widest font-medium pointer-events-none">
        Visão Pura da Alavancagem Digital
      </div>
    </div>
  );
}
