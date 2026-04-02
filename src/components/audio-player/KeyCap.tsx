import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { NOISE } from './shared';

interface KeyCapProps {
  onClick: (e: ReactMouseEvent) => void;
  size?: number;
  stem?: number;
  children: ReactNode;
  glowActive?: boolean;
  readingMode?: boolean;
}

export function KeyCap({
  onClick,
  size = 64,
  stem = 6,
  children,
  glowActive = false,
  readingMode = false,
}: KeyCapProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: 'pointer',
        border: 'none',
        background: 'none',
        padding: 0,
        transform: pressed ? `translateY(${stem}px)` : 'translateY(0)',
        transition: 'transform 0.07s cubic-bezier(0.2,0,0.4,1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          background: pressed
            ? readingMode
              ? 'linear-gradient(160deg,rgba(0,35,102,0.84) 0%,rgba(0,35,102,0.76) 100%)'
              : 'linear-gradient(160deg,#b8b3aa 0%,#bfbab1 100%)'
            : readingMode
              ? 'linear-gradient(160deg,rgba(0,35,102,0.78) 0%,rgba(0,35,102,0.68) 50%,rgba(0,35,102,0.8) 100%)'
              : 'linear-gradient(160deg,#c8c3ba 0%,#d4cfc6 50%,#ccc7be 100%)',
          transform: `translateY(${stem}px)`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.28)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          backgroundImage: [
            `url("${NOISE}")`,
            'repeating-linear-gradient(45deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 5px)',
            'repeating-linear-gradient(-45deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 5px)',
            pressed
              ? readingMode
                ? 'linear-gradient(160deg,rgba(0,35,102,0.56) 0%,rgba(0,35,102,0.5) 50%,rgba(0,35,102,0.50) 100%)'
                : 'linear-gradient(160deg,rgba(0,35,102,0.50) 0%,rgba(0,35,102,0.42) 50%,rgba(0,35,102,0.50) 100%)'
              : readingMode
                ? 'linear-gradient(145deg,rgba(0,35,102,0.62) 0%,rgba(0,35,102,0.54) 35%,rgba(0,35,102,0.47) 65%,rgba(0,35,102,0.4) 100%)'
                : 'linear-gradient(145deg,rgba(0,35,102,0.56) 0%,rgba(0,35,102,0.48) 35%,rgba(0,35,102,0.42) 65%,rgba(0,35,102,0.36) 100%)',
          ].join(','),
          backgroundSize: '256px 256px,5px 5px,5px 5px,auto',
          backgroundBlendMode: 'soft-light,normal,normal,normal',
          boxShadow: pressed
            ? '0 0 0 1px rgba(0,0,0,0.95),inset 0 3px 8px rgba(0,0,0,0.85),inset 0 1px 3px rgba(0,0,0,0.6)'
            : [
                '0 0 0 1px rgba(0,0,0,0.9)',
                'inset 0 1px 0 rgba(255,255,255,0.14)',
                'inset 1px 0 0 rgba(255,255,255,0.06)',
                'inset 0 -2px 6px rgba(0,0,0,0.5)',
                glowActive ? '0 0 18px rgba(126,200,227,0.2)' : '',
              ]
                .filter(Boolean)
                .join(','),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: pressed ? 5 : 4,
            borderRadius: 10,
            background: pressed
              ? readingMode
                ? 'linear-gradient(160deg,#c8c2b8 0%,#d3cdc4 50%,#c8c2b8 100%)'
                : 'linear-gradient(160deg,#091525 0%,#0d1c30 50%,#091525 100%)'
              : readingMode
                ? 'linear-gradient(145deg,#ddd7ce 0%,#d1cbc1 35%,#c6c0b7 65%,#bbb5ac 100%)'
                : 'linear-gradient(145deg,#0f2035 0%,#0d1c30 30%,#091a2e 60%,#091525 100%)',
            boxShadow: pressed
              ? 'inset 0 3px 10px rgba(0,0,0,0.9)'
              : 'inset 0 4px 12px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </div>
    </button>
  );
}
