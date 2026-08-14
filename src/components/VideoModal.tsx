import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Quote } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  bio?: string;
  startTime?: number;
  endTime?: number;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function VideoModal({ isOpen, onClose, videoUrl, title, bio, startTime, endTime }: VideoModalProps) {
  const playerRef = useRef<any>(null);
  const checkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load YouTube API if not already present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current) return;
      
      const videoId = videoUrl.match(/(?:embed\/|v=)([^?&]+)/)?.[1];
      
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 0,
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
          start: startTime || 0,
          ...(endTime ? { end: endTime } : {})
        },
        events: {
          onStateChange: (event: any) => {
            // When playing, start checking for the end mark
            if (event.data === window.YT.PlayerState.PLAYING && endTime) {
              if (checkIntervalRef.current) window.clearInterval(checkIntervalRef.current);
              
              checkIntervalRef.current = window.setInterval(() => {
                const currentTime = playerRef.current?.getCurrentTime();
                if (currentTime >= endTime) {
                  window.clearInterval(checkIntervalRef.current!);
                  onClose();
                }
              }, 500); // Check every half second
            } else if (event.data === window.YT.PlayerState.ENDED) {
              onClose(); // Automatically close when video naturally ends
            } else {
              if (checkIntervalRef.current) window.clearInterval(checkIntervalRef.current);
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (checkIntervalRef.current) window.clearInterval(checkIntervalRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isOpen, videoUrl, onClose, startTime, endTime]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-8 backdrop-blur-3xl bg-black/90 pointer-events-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="relative w-full max-w-7xl bg-bg-base/60 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,229,255,0.2)] border border-white/10 flex flex-col md:flex-row h-fit max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Floats over video on mobile, top right on desktop */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[110] p-3 rounded-full bg-black/50 text-white hover:bg-accent hover:text-black transition-all"
          >
            <X size={20} />
          </button>

          {/* Video Section with Player ID for API */}
          <div className="w-full md:w-[70%] aspect-video bg-black flex-shrink-0">
            <div id="youtube-player" className="w-full h-full" />
          </div>

          {/* Bio Section - 30% width on desktop */}
          <div className="w-full md:w-[30%] p-6 md:p-10 flex flex-col justify-center bg-gradient-to-br from-white/[0.02] to-transparent overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} className="text-accent" />
                <span className="text-accent-dark text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">Speaker Profile</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-serif text-white mb-2">{title}</h3>
              <div className="w-12 h-1 bg-accent/30 mb-6 rounded-full" />
              
              {bio && (
                <div className="relative">
                  <Quote size={32} className="absolute -top-4 -left-4 text-white/5 opacity-40" />
                  <p className="text-white/60 text-sm md:text-base font-light leading-relaxed italic relative z-10">
                    {bio}
                  </p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Protocolo</span>
                  <span className="text-[11px] text-accent font-mono">RIA_AUTH_VERIFIED</span>
                </div>
                {endTime ? (
                  <div className="ml-auto px-3 py-1 rounded bg-accent/10 border border-accent/20">
                    <span className="text-[9px] text-accent font-black">
                      AUTO-STOP: {Math.floor(endTime / 60)}:{(endTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <div className="ml-auto px-3 py-1 rounded bg-accent/10 border border-accent/20">
                    <span className="text-[9px] text-accent font-black">FULL_PLAYBACK</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
