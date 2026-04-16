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

const TRANSITION_DURATION = 800; // ms for text to fade out (slower, more emotional)
const WAVE_HOLD_DURATION = 2500; // ms showing ONLY the wave (dramatic silence)
const COOLDOWN_DURATION = TRANSITION_DURATION + WAVE_HOLD_DURATION + 600;

export default function NarrativeScroll({ scenes, onWaveProgress }: NarrativeScrollProps) {
  const [activeScene, setActiveScene] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const isCoolingDown = useRef(false);

  // Drive the wave whenever the active scene changes
  useEffect(() => {
    onWaveProgress(scenes[activeScene].waveProgress);
  }, [activeScene, scenes, onWaveProgress]);

  const advanceScene = useCallback((direction: 1 | -1) => {
    if (isCoolingDown.current) return;
    const next = activeScene + direction;
    if (next < 0 || next >= scenes.length) return;

    isCoolingDown.current = true;

    // 1. Fade text out
    setShowContent(false);

    setTimeout(() => {
      // 2. Wave advances (pure wave moment)
      setActiveScene(next);

      setTimeout(() => {
        // 3. New content fades in
        setShowContent(true);
        isCoolingDown.current = false;
      }, WAVE_HOLD_DURATION);
    }, TRANSITION_DURATION);
  }, [activeScene, scenes.length]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') advanceScene(1);
      if (e.key === 'ArrowUp' || e.key === 'PageUp') advanceScene(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advanceScene]);

  // Mouse wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      advanceScene(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [advanceScene]);

  // Touch swipe
  const touchStartY = useRef(0);
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 40) advanceScene(delta > 0 ? 1 : -1);
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
      {/* Content layer */}
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key={activeScene}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center"
          >
            {scenes[activeScene].content}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene indicator dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() => !isCoolingDown.current && setActiveScene(i)}
            className={`w-2 h-2 rounded-full border border-cyan-400/60 transition-all duration-300 pointer-events-auto ${
              i === activeScene ? 'bg-cyan-400 scale-125' : 'bg-transparent'
            }`}
            aria-label={`Cena ${i + 1}`}
          />
        ))}
      </div>

      {/* Bottom scroll hint */}
      {activeScene < scenes.length - 1 && showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-cyan-400/50 text-xs tracking-widest pointer-events-none"
        >
          <span className="uppercase">scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-cyan-400/50 to-transparent"
          />
        </motion.div>
      )}
    </>
  );
}
