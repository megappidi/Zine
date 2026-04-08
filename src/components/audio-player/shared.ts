export const AUDIO_SRC = '/podcastaudio.mp3';

export const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E";

export interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

export const CHAPTERS: Chapter[] = [
  { title: 'TECH_AS_ART',           startTime: 0,   endTime: 82  },
  { title: 'CODE_AS_CHEMICAL',      startTime: 82,  endTime: 193 },
  { title: 'NOSTALGIC_ORIGINS',     startTime: 193, endTime: 281 },
  { title: 'GENERALIST_PATH',       startTime: 281, endTime: 404 },
  { title: 'PATTERN_RECOGNITION',   startTime: 404, endTime: 500 },
  { title: 'AI_COGNITIVE_TOOL',     startTime: 500, endTime: 630 },
  { title: 'CONSUMPTION_TRAP',      startTime: 630, endTime: 840 },
  { title: 'IMPOSTER_SYNDROME',     startTime: 840, endTime: 930 },
  { title: 'CREATIVE_FREEDOM',      startTime: 930, endTime: 960 },
];

export const N = CHAPTERS.length;
export const GAP = 4;

export function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function segmentProgress(chapter: Chapter, t: number) {
  if (t >= chapter.endTime) return 1;
  if (t <= chapter.startTime) return 0;
  return (t - chapter.startTime) / (chapter.endTime - chapter.startTime);
}

export function buildWaveform(idx: number): string {
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const x = t * 100;
    const s = idx * 17.31;
    const y =
      10 +
      (Math.sin(t * Math.PI * 4 + s) * 3 +
        Math.sin(t * Math.PI * 7.3 + s * 0.6) * 1.5 +
        Math.sin(t * Math.PI * 11.1 + s * 1.4) * 0.8) *
        (Math.sin(t * Math.PI) * 0.6 + 0.4);

    pts.push({ x, y });
  }

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[Math.min(pts.length - 1, i + 1)];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const tension = 6;

    d += ` C ${(p1.x + (p2.x - p0.x) / tension).toFixed(2)} ${(p1.y + (p2.y - p0.y) / tension).toFixed(2)}, ${(p2.x - (p3.x - p1.x) / tension).toFixed(2)} ${(p2.y - (p3.y - p1.y) / tension).toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}
