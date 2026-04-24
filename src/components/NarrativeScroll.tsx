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
  onSceneChange: (index: number) => void;
  externalActiveScene?: number; // Prop to allow external control
}

const TRANSITION_DURATION = 800;
// Default timings that will be adjusted per device
const WAVE_HOLD_DESKTOP = 1200; // Reduced from 2500
const WAVE_HOLD_MOBILE = 800;   // Reduced from 1400

export default function NarrativeScroll({ scenes, onWaveProgress, onSceneChange, externalActiveScene }: NarrativeScrollProps) {
  const [activeScene, setActiveScene] = useState(0);

  // Sync with external control if provided
  useEffect(() => {
    if (externalActiveScene !== undefined && externalActiveScene !== activeScene) {
      setActiveScene(externalActiveScene);
    }
  }, [externalActiveScene]);
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
    onSceneChange(activeScene);
  }, [activeScene, scenes, onWaveProgress, onSceneChange]);

  const containerRef = useRef<HTMLDivElement>(null);

  const advanceScene = useCallback((direction: 1 | -1) => {
    if (isCoolingDown.current) return;
    
    // Check for internal scroll before advancing
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      const isAtTop = scrollTop <= 10;

      if (direction === 1 && !isAtBottom) return; // Allow internal scroll down
      if (direction === -1 && !isAtTop) return;   // Allow internal scroll up
    }

    const next = activeScene + direction;
    if (next < 0 || next >= scenes.length) return;

    isCoolingDown.current = true;
    setShowContent(false);

    setTimeout(() => {
      setActiveScene(next);
      setTimeout(() => {
        setShowContent(true);
        isCoolingDown.current = false;
        // Reset internal scroll for new scene
        if (containerRef.current) containerRef.current.scrollTop = 0;
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
      // If we are scrolling internally, let the event pass through
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight > clientHeight) {
          // If moving down and not at bottom, or moving up and not at top, allow default
          const { scrollTop } = containerRef.current;
          if (e.deltaY > 0 && scrollTop + clientHeight < scrollHeight - 5) return;
          if (e.deltaY < 0 && scrollTop > 5) return;
        }
      }
      
      if (Math.abs(e.deltaY) < 15) return; 
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
      
      // Internal scroll check for touch
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight > clientHeight) {
          if (delta > 0 && scrollTop + clientHeight < scrollHeight - 15) return;
          if (delta < 0 && scrollTop > 15) return;
        }
      }

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
            className="fixed inset-0 z-10 flex flex-col items-center p-4 md:p-12 overflow-y-auto overflow-x-hidden scroll-smooth"
            ref={containerRef}
          >
            <div className="w-full flex-shrink-0 flex items-center justify-center min-h-full py-20 md:py-0 pointer-events-none">
              <div className="w-full pointer-events-auto">
                {scenes[activeScene].content}
              </div>
            </div>
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
