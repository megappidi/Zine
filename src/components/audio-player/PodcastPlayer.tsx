import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'motion/react';
import { HardwareButton, Screw } from './HardwareButton';
import { InteractiveScrubber } from './InteractiveScrubber';
import { NOISE } from './shared';

interface PodcastPlayerProps {
  onMinimize?: () => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeekBy: (delta: number) => void;
  onSeek: (t: number) => void;
}

const VISUALIZER_PIXEL_RATIO = 1.5;
const VISUALIZER_FRAME_MS = 1000 / 30;

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ opacity: 0.75 }}>
      <rect x="7" y="5" width="3.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
    </svg>
  );
}

export function PodcastPlayer({ onMinimize, isPlaying, currentTime, duration, onTogglePlay, onSeekBy, onSeek }: PodcastPlayerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const isPlayingRef = useRef(false);
  const tiltCur = useRef({ x: 2, y: 0 });
  const tiltTgt = useRef({ x: 2, y: 0 });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);


  useEffect(() => {
    let raf: number;

    const tick = () => {
      const lerp = (a: number, b: number) => a + (b - a) * 0.055;
      tiltCur.current.x = lerp(tiltCur.current.x, tiltTgt.current.x);
      tiltCur.current.y = lerp(tiltCur.current.y, tiltTgt.current.y);

      if (tiltRef.current) {
        tiltRef.current.style.transform = `rotateX(${tiltCur.current.x.toFixed(3)}deg) rotateY(${tiltCur.current.y.toFixed(3)}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf: number;
    const BAR_COUNT = 56;
    const bars = Array.from({ length: BAR_COUNT }, () => Math.random() * 20);
    let lastW = 0;
    let lastH = 0;
    let lastFrameTime = 0;

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);

      if (document.hidden) return;
      if (time - lastFrameTime < VISUALIZER_FRAME_MS) return;
      lastFrameTime = time;

      const pw = canvas.parentElement?.clientWidth ?? 0;
      const ph = canvas.parentElement?.clientHeight ?? 0;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, VISUALIZER_PIXEL_RATIO);

      if (pw !== lastW || ph !== lastH) {
        canvas.width = Math.floor(pw * pixelRatio);
        canvas.height = Math.floor(ph * pixelRatio);
        lastW = pw;
        lastH = ph;
      }

      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) {
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.5, w * 0.7);
      bg.addColorStop(0, '#0d2440');
      bg.addColorStop(0.5, '#071828');
      bg.addColorStop(1, '#020a14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, w * 0.75);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,4,12,0.65)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      const playing = isPlayingRef.current;
      const gutter = w * 0.07;
      const bw = (w - gutter * 2) / BAR_COUNT;
      const cy = h * 0.47;
      const now = Date.now();

      bars.forEach((_, i) => {
        const target = playing
          ? Math.sin(now * 0.002 + i * 0.55) * 0.35 * h * 0.36 +
            0.65 * h * 0.36 * (Math.sin(i * 0.28 + now * 0.0008) * 0.25 + 0.75)
          : h * 0.011 + Math.sin(i * 0.45 + now * 0.0003) * h * 0.004;

        bars[i] += (target - bars[i]) * 0.08;

        const x = gutter + i * bw;
        const half = bars[i] / 2;
        const barW = bw - 4;
        const norm = bars[i] / (h * 0.36);
        const a = playing ? 0.5 + norm * 0.5 : 0.1;

        const g = ctx.createLinearGradient(x, cy - half, x, cy + half);
        g.addColorStop(0, `rgba(220,248,255,${a * 0.92})`);
        g.addColorStop(0.25, `rgba(0,210,240,${a * 0.78})`);
        g.addColorStop(0.5, `rgba(0,100,180,${a * 0.45})`);
        g.addColorStop(0.75, `rgba(0,210,240,${a * 0.78})`);
        g.addColorStop(1, `rgba(220,248,255,${a * 0.92})`);
        ctx.fillStyle = g;

        const r = Math.min(barW / 2, 3);
        ctx.beginPath();
        ctx.moveTo(x + 1 + r, cy - half);
        ctx.arcTo(x + 1 + barW, cy - half, x + 1 + barW, cy + half, r);
        ctx.arcTo(x + 1 + barW, cy + half, x + 1, cy + half, r);
        ctx.arcTo(x + 1, cy + half, x + 1, cy - half, r);
        ctx.arcTo(x + 1, cy - half, x + 1 + barW, cy - half, r);
        ctx.fill();

        if (playing && norm > 0.55) {
          ctx.fillStyle = `rgba(180,240,255,${(norm - 0.55) * 0.35})`;
          ctx.fillRect(x + 2, cy - half + 1, barW - 4, 2);
        }
      });

      if (playing) {
        const bloom = ctx.createLinearGradient(0, h * 0.7, 0, h);
        bloom.addColorStop(0, 'rgba(0,100,180,0)');
        bloom.addColorStop(1, 'rgba(0,60,120,0.18)');
        ctx.fillStyle = bloom;
        ctx.fillRect(0, h * 0.7, w, h * 0.3);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: globalThis.MouseEvent) =>
      setPosition({
        x: posStart.current.x + e.clientX - dragStart.current.x,
        y: posStart.current.y + e.clientY - dragStart.current.y,
      });

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      setPosition({
        x: posStart.current.x + t.clientX - dragStart.current.x,
        y: posStart.current.y + t.clientY - dragStart.current.y,
      });
    };

    const stop = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stop);
    };
  }, [isDragging]);


  const onMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isDragging) return;
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      tiltTgt.current = {
        x: 2 + ((top + height / 2 - e.clientY) / height) * 7,
        y: ((e.clientX - left - width / 2) / width) * 9,
      };
    },
    [isDragging],
  );

  const startDrag = useCallback(
    (x: number, y: number, target: HTMLElement) => {
      if (target.closest('button') || target.closest('[data-interactive]')) return;
      setIsDragging(true);
      dragStart.current = { x, y };
      posStart.current = { ...position };
    },
    [position],
  );

  const clock = new Date()
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toLowerCase();
  const session = `0.${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;

  return (
    <div
      className="relative w-full max-w-[700px] mx-auto"
      style={{
        perspective: '1600px',
        perspectiveOrigin: '50% 45%',
        transform: `translate(${position.x}px,${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'transform 0.12s ease-out',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        tiltTgt.current = { x: 2, y: 0 };
      }}
      onMouseDown={(e) => startDrag(e.clientX, e.clientY, e.target as HTMLElement)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY, e.target as HTMLElement);
      }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: -28,
          left: '8%',
          right: '8%',
          height: 40,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 45%, transparent 75%)',
          filter: 'blur(14px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: -50,
          left: '15%',
          right: '15%',
          height: 30,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
          filter: 'blur(22px)',
        }}
      />

      <div ref={tiltRef} style={{ willChange: 'transform' }}>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {onMinimize && (
            <button
              onClick={onMinimize}
              aria-label="Minimize"
              className="absolute z-50 cursor-pointer"
              style={{
                top: -14,
                right: -14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid rgba(126,200,227,0.25)',
                background: 'rgba(4,18,34,0.85)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.5), 0 0 12px rgba(126,200,227,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
              }}
              onMouseEnter={(e) => {
                const button = e.currentTarget;
                button.style.borderColor = 'rgba(126,200,227,0.7)';
                button.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.5), 0 0 18px rgba(126,200,227,0.3)';
                button.style.background = 'rgba(0,30,50,0.92)';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget;
                button.style.borderColor = 'rgba(126,200,227,0.25)';
                button.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.5), 0 0 12px rgba(126,200,227,0.08)';
                button.style.background = 'rgba(4,18,34,0.85)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.88)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = '';
              }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 2L9 9M9 2L2 9" stroke="#7ec8e3" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <div
            className="relative rounded-[2.4rem]"
            style={{
              padding: 11,
              background: [
                `url("${NOISE}")`,
                'repeating-linear-gradient(90deg,transparent 0,transparent 2px,rgba(255,255,255,0.009) 2px,rgba(255,255,255,0.009) 3px)',
                'repeating-linear-gradient(90deg,transparent 0,transparent 5px,rgba(0,0,0,0.012) 5px,rgba(0,0,0,0.012) 6px)',
                'linear-gradient(175deg,#e8e3da 0%,#ede8df 8%,#f0ece4 22%,#ede8df 36%,#e8e3da 46%,#ede8df 54%,#f0ece4 64%,#ede8df 76%,#e8e3da 88%,#e2ddd4 100%)',
              ].join(','),
              backgroundSize: '256px 256px,auto,auto,auto',
              boxShadow: [
                '0 0 0 1px rgba(0,0,0,0.9)',
                '0 2px 0 0 rgba(255,255,255,0.055)',
                '0 28px 55px -12px rgba(0,0,0,0.75)',
                '0 60px 100px -20px rgba(0,0,0,0.55)',
                'inset 0 1px 0 rgba(255,255,255,0.07)',
                'inset 0 -1px 0 rgba(0,0,0,0.5)',
              ].join(','),
            }}
          >
            <div
              className="absolute inset-0 rounded-[2.4rem] pointer-events-none"
              style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: '256px 256px', opacity: 0.055, mixBlendMode: 'overlay' }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0,
                left: '6%',
                right: '6%',
                height: 1.5,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.22) 25%,rgba(255,255,255,0.35) 50%,rgba(255,255,255,0.22) 75%,transparent)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{ top: '6%', bottom: '6%', left: 0, width: 1.5, background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.18) 50%,transparent)' }}
            />
            <div
              className="absolute pointer-events-none"
              style={{ top: '10%', bottom: '10%', right: 0, width: 1, background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.05) 50%,transparent)' }}
            />
            <div
              className="absolute top-0 left-0 pointer-events-none rounded-tl-[2.4rem]"
              style={{ width: 80, height: 80, background: 'radial-gradient(ellipse at 0% 0%,rgba(255,255,255,0.1) 0%,transparent 65%)' }}
            />
            <Screw style={{ top: 16, left: 16 }} />
            <Screw style={{ top: 16, right: 16 }} />
            <Screw style={{ bottom: 16, left: 16 }} />
            <Screw style={{ bottom: 16, right: 16 }} />

            <div
              className="relative rounded-[1.5rem]"
              style={{
                padding: 3,
                background: 'linear-gradient(160deg,#0a1422 0%,#070f1a 50%,#0a1422 100%)',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.95),inset 0 2px 4px rgba(0,0,0,0.8),0 0 0 1px rgba(0,0,0,0.8)',
                aspectRatio: '16/9',
              }}
            >
              <div
                className="absolute inset-[3px] rounded-[1.3rem] pointer-events-none z-10"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.12)' }}
              />
              <div
                className="relative w-full h-full"
                style={{ background: '#030e1c', borderRadius: '1.3rem', clipPath: 'inset(0 round 1.3rem)' }}
              >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px rgba(0,40,80,0.5),inset 0 0 6px rgba(0,60,120,0.3)' }}
                />
                <div className="absolute top-5 left-9 z-40 flex items-center gap-2.5 pointer-events-none">
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: isPlaying ? '#7ec8e3' : '#0d3050',
                      boxShadow: isPlaying
                        ? '0 0 8px #7ec8e3,0 0 18px rgba(126,200,227,0.6),0 0 3px #fff'
                        : 'inset 0 1px 2px rgba(0,0,0,0.8)',
                      transition: 'all 0.5s',
                    }}
                  />
                  <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: 'rgba(130,215,240,0.45)' }}>
                    LAB_SESSION // {session}
                  </span>
                </div>
                <div className="absolute top-5 right-9 z-40 pointer-events-none">
                  <span className="text-[9px] tracking-[0.25em]" style={{ color: 'rgba(0,160,200,0.35)' }}>
                    {clock}
                  </span>
                </div>
                <div
                  data-interactive="true"
                  className="absolute bottom-0 left-0 right-0 px-9 pb-5 pt-12 z-30"
                  style={{
                    background: 'linear-gradient(to top,rgba(2,9,22,0.98) 0%,rgba(4,15,35,0.88) 25%,rgba(5,20,45,0.5) 60%,transparent 100%)',
                    cursor: 'default',
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <InteractiveScrubber currentTime={currentTime} duration={duration} onSeek={onSeek} />
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: [
                      'radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,255,255,0.055) 0%,transparent 100%)',
                      'linear-gradient(170deg,rgba(200,230,255,0.04) 0%,transparent 30%)',
                    ].join(','),
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 6,
                    left: '20%',
                    right: '20%',
                    height: 1,
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14) 50%,transparent)',
                    filter: 'blur(0.5px)',
                  }}
                />
              </div>
            </div>

            <div className="relative mt-2 px-4 pb-3 pt-1.5">
              <div
                className="relative rounded-[18px] px-6 py-4 mx-auto"
                style={{
                  maxWidth: 370,
                  background: [
                    `url("${NOISE}")`,
                    'repeating-linear-gradient(90deg,transparent 0,transparent 2px,rgba(255,255,255,0.006) 2px,rgba(255,255,255,0.006) 3px)',
                    'radial-gradient(ellipse at center,rgba(0,35,102,0.52) 0%,rgba(0,35,102,0.44) 55%,rgba(0,35,102,0.36) 100%)',
                  ].join(','),
                  backgroundSize: '256px 256px,auto,auto',
                  boxShadow: [
                    'inset 0 6px 18px rgba(0,0,0,0.88)',
                    'inset 0 3px 6px rgba(0,0,0,0.7)',
                    'inset 0 -1px 0 rgba(255,255,255,0.03)',
                    '0 0 0 1px rgba(0,0,0,0.6)',
                    '0 2px 0 rgba(255,255,255,0.035)',
                  ].join(','),
                }}
              >
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    left: '10%',
                    right: '10%',
                    height: 1,
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08) 50%,transparent)',
                  }}
                />
                <div className="flex items-center justify-center gap-5">
                  <HardwareButton id="back" onClick={() => onSeekBy(-10)} label="-10s" w={82} h={46} />
                  <HardwareButton
                    id="play"
                    onClick={onTogglePlay}
                    label={isPlaying ? 'PAUSE' : 'PLAY'}
                    w={74}
                    h={56}
                    isActive={isPlaying}
                    icon={
                      isPlaying ? (
                        <PauseIcon />
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="white"
                          style={{ opacity: 0.7, transform: 'translateX(1px)' }}
                        >
                          <polygon points="7,4 20,12 7,20" />
                        </svg>
                      )
                    }
                  />
                  <HardwareButton id="fwd" onClick={() => onSeekBy(10)} label="+10s" w={82} h={46} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
