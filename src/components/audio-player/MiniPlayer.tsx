import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useAtom } from 'jotai';
import { motion } from 'motion/react';
import { modeAtom } from '../UI';
import { KeyCap } from './KeyCap';
import { AUDIO_SRC, fmt } from './shared';

interface MiniPlayerProps {
  onExpand: () => void;
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const [isReadingMode] = useAtom(modeAtom);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const shellTone = '#ede8df';
  const accent = '#0d2a40';
  const accentBright = '#7ec8e3';
  const fgMain = isReadingMode ? 'rgba(0,35,102,0.72)' : 'rgba(237,232,223,0.75)';
  const fgSoft = isReadingMode ? 'rgba(0,35,102,0.46)' : 'rgba(131,201,223,0.38)';
  const fgLabel = isReadingMode ? 'rgba(0,35,102,0.5)' : 'rgba(237,232,223,0.42)';

  const togglePlay = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      const audio = audioRef.current;
      if (!audio) return;
      isPlaying ? audio.pause() : audio.play().catch(console.warn);
    },
    [isPlaying],
  );

  const seek = useCallback((delta: number, e: ReactMouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
  }, []);

  const handleBarClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    },
    [duration],
  );

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.7, opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
      >
        <motion.div
          animate={{ scaleX: [1, 0.86, 1], opacity: [0.5, 0.25, 0.5] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: -22,
            left: '5%',
            right: '5%',
            height: 14,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, transparent 70%)',
            filter: 'blur(8px)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
          <motion.button
            onClick={onExpand}
            aria-label="Open full player"
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'rgba(126,200,227,0.06)',
              border: '1px solid rgba(126,200,227,0.18)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              zIndex: 10,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.55], opacity: [0.35, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: -1,
                borderRadius: 8,
                border: '1px solid rgba(126,200,227,0.5)',
                pointerEvents: 'none',
              }}
            />
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 4.5V1h3.5" stroke="#7ec8e3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              <path d="M12 4.5V1H8.5" stroke="#7ec8e3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              <path d="M1 8.5V12h3.5" stroke="#7ec8e3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              <path d="M12 8.5V12H8.5" stroke="#7ec8e3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            </svg>
          </motion.button>

          <KeyCap size={64} stem={5} onClick={(e) => seek(-10, e)} readingMode={isReadingMode}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M11 17l-5-5 5-5" stroke={fgMain} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 17l-5-5 5-5" stroke={fgSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 7.5, letterSpacing: '0.08em', color: fgLabel, textTransform: 'uppercase' }}>-10s</span>
            </div>
          </KeyCap>

          <KeyCap size={72} stem={6} onClick={togglePlay} glowActive={isPlaying} readingMode={isReadingMode}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  position: 'absolute',
                  top: 9,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: isPlaying ? accentBright : accent,
                  boxShadow: isPlaying
                    ? '0 0 6px rgba(131,201,223,0.95), 0 0 14px rgba(131,201,223,0.45), 0 0 2px rgba(255,255,255,0.8)'
                    : 'inset 0 1px 2px rgba(0,0,0,0.8)',
                  transition: 'all 0.4s',
                }}
              />
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isReadingMode ? 'rgba(0,35,102,0.82)' : 'rgba(237,232,223,0.88)'} style={{ marginTop: 6 }}>
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isReadingMode ? 'rgba(0,35,102,0.82)' : shellTone} style={{ opacity: 0.82, transform: 'translateX(1px)', marginTop: 6 }}>
                  <polygon points="7,4 20,12 7,20" />
                </svg>
              )}
            </div>
          </KeyCap>

          <KeyCap size={64} stem={5} onClick={(e) => seek(10, e)} readingMode={isReadingMode}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 17l5-5-5-5" stroke={fgSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 17l5-5-5-5" stroke={fgMain} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 7.5, letterSpacing: '0.08em', color: fgLabel, textTransform: 'uppercase' }}>+10s</span>
            </div>
          </KeyCap>
        </div>

        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div
            onClick={handleBarClick}
            style={{ height: 3, borderRadius: 2, cursor: 'pointer', background: 'rgba(255,255,255,0.07)', position: 'relative' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg,rgba(0,180,220,0.7),#7ec8e3)',
                borderRadius: 2,
                boxShadow: '0 0 6px rgba(126,200,227,0.5)',
                transition: 'width 0.25s linear',
              }}
            />
            {duration > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${pct}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#7ec8e3',
                  boxShadow: '0 0 6px rgba(126,200,227,0.9)',
                  transition: 'left 0.25s linear',
                }}
              />
            )}
          </div>
          <span style={{ fontSize: 8, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)' }}>
            {fmt(currentTime)}
            {duration ? ` / ${fmt(duration)}` : ''}
          </span>
        </div>
      </motion.div>

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
    </motion.div>
  );
}
