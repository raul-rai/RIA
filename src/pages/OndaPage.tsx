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
    <div className="bg-white min-h-screen overflow-hidden">
      <div className="fixed top-6 left-6 z-30 pointer-events-none">
        <span className="text-slate-500 text-[10px] tracking-[0.4em] uppercase font-bold">RIA • Isolated Wave</span>
      </div>

      <DataWave3D progress={progress} />

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 text-slate-400 text-[10px] uppercase tracking-widest font-medium pointer-events-none">
        Visão Pura da Alavancagem Digital
      </div>
    </div>
  );
}
