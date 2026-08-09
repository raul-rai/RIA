import { useEffect } from 'react';
import { useMotionValue } from 'motion/react';
import DataWave3D from '../components/DataWave3D';

export default function OndaPage() {
  // MotionValue em vez de state: a oscilacao nao precisa de re-render.
  const progress = useMotionValue(0.8);

  useEffect(() => {
    const start = Date.now();
    let frameId: number;

    const animate = () => {
      const elapsed = (Date.now() - start) / 1000;
      progress.set(0.8 + Math.sin(elapsed * 0.5) * 0.05);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [progress]);

  return (
    <div className="bg-[#000408] min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-30 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="fixed top-6 left-6 z-30 pointer-events-none">
        <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-bold">RIA • Isolated Wave</span>
      </div>

      <DataWave3D progress={progress} />

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 text-white/20 text-[10px] uppercase tracking-widest font-medium pointer-events-none">
        Visão Pura da Alavancagem Digital
      </div>
    </div>
  );
}
