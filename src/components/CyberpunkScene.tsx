import { motion, AnimatePresence } from 'motion/react';

interface CyberpunkSceneProps {
  activeScene: number;
}

// The background scene — transitions from real to cyberpunk in the last fold.
export default function CyberpunkScene({ activeScene }: CyberpunkSceneProps) {
  const isLastScene = activeScene === 3;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={isLastScene ? 'cyber' : 'real'}
          src={isLastScene ? '/rio-cyberpunk.png' : '/rio-real.png'}
          alt={isLastScene ? "Rio Cyberpunk" : "Rio Real"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover object-bottom"
          style={{ mixBlendMode: isLastScene ? 'screen' : 'normal' }}
        />
      </AnimatePresence>

      {/* Deep sky overlay — ensures the top is pure darkness matching the wave's background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000408] via-[#000408]/60 to-transparent" style={{height: '55%'}} />

      {/* Subtle scanlines for cyberpunk texture — only active in last scene or always? 
          User said "estilo cyberpunk apenas na ultima dobra", but maybe scanlines are part of the style.
          Let's make them stronger in the last scene.
      */}
      <motion.div
        animate={{ opacity: isLastScene ? 0.05 : 0.01 }}
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.15) 2px, rgba(0,229,255,0.15) 3px)',
          backgroundSize: '100% 3px'
        }}
      />

      {/* Ground-level neon glow bleeding from city */}
      <motion.div 
        animate={{ opacity: isLastScene ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#00050A] to-transparent" 
      />
    </div>
  );
}
