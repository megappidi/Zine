import { useCallback, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CHAPTERS, GAP, N, buildWaveform, fmt, segmentProgress } from './shared';

interface ScrubberProps {
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}

export function InteractiveScrubber({ currentTime, duration, onSeek }: ScrubberProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const waveforms = useMemo(() => CHAPTERS.map((_, i) => buildWaveform(i)), []);

  const resolve = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return null;

    const { left, width } = el.getBoundingClientRect();
    const relX = e.clientX - left;
    const segW = (width - GAP * (N - 1)) / N;
    const stride = segW + GAP;

    for (let i = 0; i < N; i++) {
      const start = i * stride;
      if (relX >= start && relX <= start + segW) {
        return { index: i, ratio: (relX - start) / segW };
      }
    }

    return null;
  }, []);

  const onMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const r = resolve(e);
      setHovered(r ? r.index : null);
    },
    [resolve],
  );

  const onClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const r = resolve(e);
      if (!r) return;

      const chapter = CHAPTERS[r.index];
      onSeek(Math.round(chapter.startTime + r.ratio * (chapter.endTime - chapter.startTime)));
    },
    [resolve, onSeek],
  );

  const tipX =
    hovered === null ? '-50%' : hovered === 0 ? '0%' : hovered === N - 1 ? '-100%' : '-50%';

  return (
    <div className="relative w-full flex flex-col select-none">
      <div className="relative h-7 mb-1.5 pointer-events-none">
        <AnimatePresence>
          {hovered !== null && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, x: tipX }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="absolute bottom-0"
              style={{ left: `${(hovered + 0.5) * (100 / N)}%`, width: 'max-content', maxWidth: 200 }}
            >
              <div
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg whitespace-nowrap"
                style={{
                  background: 'rgba(4,14,30,0.96)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,160,220,0.18)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.85), inset 0 1px 0 rgba(0,200,255,0.07)',
                }}
              >
                <span className="text-[#7ec8e3] text-[9px] tracking-[0.1em]">
                  {fmt(CHAPTERS[hovered].startTime)}
                </span>
                <span className="text-white/20">-</span>
                <span className="text-white/80 text-[9px] tracking-wider uppercase">
                  {CHAPTERS[hovered].title}
                </span>
              </div>
              <div
                className="absolute top-full"
                style={{
                  left: hovered === 0 ? '15%' : hovered === N - 1 ? '85%' : '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(4,14,30,0.96)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={trackRef}
        className="flex items-center w-full cursor-pointer"
        style={{ gap: GAP, height: 32, position: 'relative', zIndex: 10 }}
        onMouseMove={onMove}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
      >
        {CHAPTERS.map((chapter, i) => {
          const progress = segmentProgress(chapter, currentTime);
          const isHovered = hovered === i;

          return (
            <div key={chapter.title} className="relative flex-1 h-full flex items-center">
              <div
                className="absolute inset-x-0 rounded-[4px] overflow-hidden"
                style={{
                  height: isHovered ? 14 : 7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  transition: 'height 0.25s cubic-bezier(0.2,0.8,0.2,1)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: isHovered ? 'rgba(0,180,216,0.22)' : 'rgba(2,62,138,0.35)',
                    transition: 'background 0.2s',
                  }}
                />
                {progress > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${progress * 100}%`, background: 'rgba(126,200,227,0.1)' }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 20"
                      preserveAspectRatio="none"
                      className="absolute inset-0"
                    >
                      <path
                        d={waveforms[i]}
                        fill="none"
                        stroke="#7ec8e3"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.2"
                      />
                      <path
                        d={waveforms[i]}
                        fill="none"
                        stroke="#7ec8e3"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{
                          filter: `drop-shadow(0 0 ${isHovered ? '6px' : '3px'} rgba(126,200,227,0.8))`,
                        }}
                      />
                      <path
                        d={waveforms[i]}
                        fill="none"
                        stroke="white"
                        strokeWidth="0.6"
                        strokeLinecap="round"
                        opacity="0.5"
                      />
                    </svg>
                  </div>
                )}
                {progress > 0 && progress < 1 && (
                  <div
                    className="absolute top-0 bottom-0 w-[3px] rounded-full"
                    style={{
                      left: `${progress * 100}%`,
                      transform: 'translateX(-1.5px)',
                      background: '#7ec8e3',
                      boxShadow: '0 0 10px #7ec8e3, 0 0 20px rgba(126,200,227,0.5)',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 px-1 pointer-events-none">
        <span className="text-[10px] tracking-[0.1em]" style={{ color: 'rgba(0,180,216,0.6)' }}>
          {fmt(currentTime)}
        </span>
        <span className="text-[10px] tracking-[0.1em]" style={{ color: 'rgba(2,62,138,0.7)' }}>
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
