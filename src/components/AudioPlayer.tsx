import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MiniPlayer } from './audio-player/MiniPlayer';

const loadPodcastPlayer = () =>
  import('./audio-player/PodcastPlayer').then((module) => ({
    default: module.PodcastPlayer,
  }));

const PodcastPlayer = lazy(loadPodcastPlayer);

export default function AudioPlayer() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let timeoutId = 0;
    let idleId = 0;

    const preload = () => {
      void loadPodcastPlayer();
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(idleId);
    }

    timeoutId = window.setTimeout(preload, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 144, right: 84, zIndex: 50 }}>
      <AnimatePresence mode="wait">
        {!expanded ? (
          <div key="mini" style={{ transform: 'scale(0.85)', transformOrigin: 'bottom right' }}>
            <MiniPlayer onExpand={() => setExpanded(true)} />
          </div>
        ) : (
          <div key="full" style={{ transform: 'scale(0.75)', transformOrigin: 'bottom right' }}>
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0, y: 28 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-5xl flex flex-col items-center"
            >
              <Suspense fallback={null}>
                <PodcastPlayer onMinimize={() => setExpanded(false)} />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
