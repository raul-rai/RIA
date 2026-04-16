import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Scene {
  id: number;
  waveProgress: number;
  content: React.ReactNode;
}

interface NarrativeScrollProps {
  scenes: Scene[];
  onWaveProgress: (p: number) => void;
}

const TRANSITION_DURATION = 800;
// Default timings that will be adjusted per device
const WAVE_HOLD_DESKTOP = 2500;
const WAVE_HOLD_MOBILE = 1400;

export default function NarrativeScroll({ scenes, onWaveProgress }: NarrativeScrollProps) {
  const [activeScene, setActiveScene] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const isCoolingDown = useRef(false);

  // Detect mobile for adjusted timings
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentWaveHold = isMobile ? WAVE_HOLD_MOBILE : WAVE_HOLD_DESKTOP;

  useEffect(() => {
    onWaveProgress(scenes[activeScene].waveProgress);
  }, [activeScene, scenes, onWaveProgress]);

  const advanceScene = useCallback((direction: 1 | -1) => {
    if (isCoolingDown.current) return;
    const next = activeScene + direction;
    if (next < 0 || next >= scenes.length) return;

    isCoolingDown.current = true;
    setShowContent(false);

    setTimeout(() => {
      setActiveScene(next);
      setTimeout(() => {
        setShowContent(true);
        isCoolingDown.current = false;
      }, currentWaveHold);
    }, TRANSITION_DURATION);
  }, [activeScene, scenes.length, currentWaveHold]);

  // Input Handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') advanceScene(1);
      if (e.key === 'ArrowUp' || e.key === 'PageUp') advanceScene(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advanceScene]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 10) return; // Ignore micro-scrolls
      advanceScene(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [advanceScene]);

  const touchStartY = useRef(0);
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 50) advanceScene(delta > 0 ? 1 : -1);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [advanceScene]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key={activeScene}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center p-6 md:p-12"
          >
            {scenes[activeScene].content}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Improved Touch Targets for Navigation Dots */}
      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() => !isCoolingDown.current && setActiveScene(i)}
            className="group p-3 pointer-events-auto"
            aria-label={`Ir para seção ${i + 1}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full border border-cyan-400/40 transition-all duration-500 ${
              i === activeScene ? 'bg-cyan-400 scale-[1.8] shadow-[0_0_12px_rgba(0,229,255,0.6)]' : 'bg-transparent group-hover:bg-cyan-400/30'
            }`} />
          </button>
        ))}
      </div>

      {/* Floating Indicators */}
      {activeScene < scenes.length - 1 && showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
        >
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent relative">
            <motion.div 
              animate={{ y: [0, 24, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute top-0 left-[-1px] w-[3px] h-[3px] bg-accent rounded-full"
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
