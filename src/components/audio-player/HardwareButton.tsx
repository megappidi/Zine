import { memo, useState, type CSSProperties, type ReactNode } from 'react';

export function Screw({ style }: { style: CSSProperties }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 32%, #d4cfc6 0%, #bfbab1 55%, #b0aba2 100%)',
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.09), inset 0 -1px 2px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.7)',
        ...style,
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ position: 'absolute', width: 5, height: 1, background: 'rgba(0,0,0,0.65)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', width: 1, height: 5, background: 'rgba(0,0,0,0.65)', borderRadius: 1 }} />
      </div>
    </div>
  );
}

interface HardwareButtonProps {
  id: string;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  w: number;
  h: number;
  isActive?: boolean;
}

export const HardwareButton = memo(function HardwareButton({
  id,
  onClick,
  label,
  icon,
  w,
  h,
  isActive,
}: HardwareButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isPlay = id === 'play';

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={(e) => {
        e.stopPropagation();
        setPressed(true);
      }}
      onTouchEnd={() => setPressed(false)}
      aria-label={label}
      className="relative cursor-pointer select-none"
      style={{
        width: w,
        height: h,
        transform: pressed ? 'translateY(2.5px) scale(0.965)' : 'none',
        transition: 'transform 0.07s cubic-bezier(0.2,0,0.4,1)',
      }}
    >
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none"
        style={{
          background: pressed
            ? 'linear-gradient(160deg, #091525 0%, #0d1c30 60%, #091525 100%)'
            : 'linear-gradient(160deg, #0f2035 0%, #0d1c30 40%, #091525 75%, #060e1a 100%)',
          boxShadow: pressed
            ? 'inset 0 3px 8px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.5)'
            : '0 5px 14px rgba(0,0,0,0.8), 0 2px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      />
      {!pressed && (
        <div
          className="absolute left-[8px] right-[8px] rounded-full pointer-events-none"
          style={{ top: 1, height: 1, background: 'rgba(255,255,255,0.14)' }}
        />
      )}
      {isPlay && isActive && (
        <div
          className="absolute -inset-3 rounded-2xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(126,200,227,0.13) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
      )}
      <div
        className="absolute rounded-[7px] flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          inset: pressed ? 4 : 3,
          background: isPlay
            ? 'linear-gradient(175deg, #0d1c30 0%, #112238 45%, #0d1c30 100%)'
            : 'linear-gradient(175deg, #091a2e 0%, #0f2035 45%, #0d1c30 100%)',
          boxShadow: pressed
            ? 'inset 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 3px rgba(0,0,0,0.6)'
            : 'inset 0 4px 10px rgba(0,0,0,0.7), inset 0 -1px 2px rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 6px)',
              'repeating-linear-gradient(-45deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 6px)',
            ].join(','),
          }}
        />
        <div
          className="absolute top-[3px] left-[8px] right-[8px] h-px rounded-full"
          style={{ background: 'rgba(255,255,255,0.055)' }}
        />
        {icon ?? (
          <span
            className="relative z-10 text-[11px] tracking-wider"
            style={{ color: pressed ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)' }}
          >
            {label}
          </span>
        )}
      </div>
    </button>
  );
});
