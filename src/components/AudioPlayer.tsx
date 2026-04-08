import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MiniPlayer } from './audio-player/MiniPlayer';
import { useIsMobile } from '../hooks/useIsMobile';
import { AUDIO_SRC } from './audio-player/shared';

const loadPodcastPlayer = () =>
  import('./audio-player/PodcastPlayer').then((module) => ({
    default: module.PodcastPlayer,
  }));

const PodcastPlayer = lazy(loadPodcastPlayer);

export default function AudioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play().catch(console.warn);
  }, [isPlaying]);

  const seekBy = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
  }, []);

  const handleSeek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    let timeoutId = 0;
    let idleId = 0;

    const preload = () => {
      void loadPodcastPlayer();
    };

    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(preload);
      return () => w.cancelIdleCallback(idleId);
    }

    timeoutId = w.setTimeout(preload, 1200);
    return () => w.clearTimeout(timeoutId);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setExpanded(false);
    }
  }, [isMobile]);

  return (
    <div
      className="app-player-shell"
      style={{
        zIndex: 50,
      }}
    >
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <AnimatePresence mode="wait">
        {!expanded ? (
          <div
            key="mini"
            style={{
              transform: 'scale(var(--app-mini-player-scale))',
              transformOrigin: 'var(--app-player-origin)',
            }}
          >
            <MiniPlayer
              onExpand={() => setExpanded(true)}
              allowExpand={!isMobile}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={togglePlay}
              onSeek={seekBy}
              onBarClick={handleSeek}
            />
          </div>
        ) : (
          <div
            key="full"
            style={{
              transform: 'scale(var(--app-full-player-scale))',
              transformOrigin: 'var(--app-player-origin)',
            }}
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0, y: 28 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-5xl flex flex-col items-center"
            >
              <Suspense fallback={null}>
                <PodcastPlayer
                  onMinimize={() => setExpanded(false)}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onTogglePlay={togglePlay}
                  onSeekBy={seekBy}
                  onSeek={handleSeek}
                />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
