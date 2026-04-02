import { atom, useAtom } from "jotai";
import { useEffect, useRef } from "react";

export type PageData = {
  front: string;
  back: string;
  title: string;
};

const HEADER_BUTTON_CLASS =
  "bg-white text-[#002366] px-6 py-2 border-2 border-[#002366] font-bold hover:bg-[#002366] hover:text-white transition-all shadow-[4px_4px_0px_#002366]";

const pictures = [
  "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27",
] as const;

export const pageAtom = atom<number>(0);
export const modeAtom = atom<boolean>(false); // false = 3D, true = Reading
export const indexOpenAtom = atom<boolean>(false);
export const skyAtom = atom<boolean>(false); // false = paper overlay, true = sky visible

const pageTitles = [
  "Cover - Manifesto",
  "Index",
  "Who I am",
  "How I think",
  "Creativity + Technology",
  "Generalist Vs AI",
  "Coloring outside the lines",
] as const;

export const pages: PageData[] = Array.from({ length: Math.ceil(pictures.length / 2) }, (_, index) => ({
  front: pictures[index * 2],
  back: pictures[index * 2 + 1],
  title: pageTitles[index] ?? `Page ${index + 1}`,
}));

function getIndexButtonClass(isReadingMode: boolean, indexOpen: boolean) {
  if (isReadingMode) {
    return indexOpen
      ? "bg-white text-[#0a1628] border-white"
      : "bg-transparent text-white border-white hover:bg-white hover:text-[#0a1628]";
  }

  return indexOpen
    ? "bg-[#002366] text-white border-[#002366]"
    : "bg-white text-[#002366] border-[#002366] hover:bg-[#002366] hover:text-white";
}

function getProgressSegmentClass(isReadingMode: boolean, isActive: boolean, isFilled: boolean) {
  if (isReadingMode) {
    if (isActive) return "bg-white h-full";
    if (isFilled) return "bg-white/60 h-3/4";
    return "bg-white/20 h-1/2 hover:bg-white/40 hover:h-3/4";
  }

  if (isActive) return "bg-[#002366] h-full";
  if (isFilled) return "bg-[#002366]/60 h-3/4";
  return "bg-[#002366]/20 h-1/2 hover:bg-[#002366]/40 hover:h-3/4";
}

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const [isReadingMode, setIsReadingMode] = useAtom(modeAtom);
  const [indexOpen, setIndexOpen] = useAtom(indexOpenAtom);
  const [, setSkyVisible] = useAtom(skyAtom);
  const skyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (skyTimerRef.current) clearTimeout(skyTimerRef.current); }, []);

  const handleTitleClick = () => {
    setSkyVisible(true);
    if (skyTimerRef.current) clearTimeout(skyTimerRef.current);
    skyTimerRef.current = setTimeout(() => setSkyVisible(false), 5000);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(pages.length, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
      if (e.key === "Escape") setIndexOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setIndexOpen, setPage]);

  const currentTitle = pages[Math.min(page, pages.length - 1)]?.title ?? "";

  return (
    <main className="fixed inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-8 font-mono">
      {/* HEADER */}
      <div className="flex justify-between items-start pointer-events-auto">
        <button
          onClick={handleTitleClick}
          className={HEADER_BUTTON_CLASS}
        >
          <h1 className="font-bold uppercase tracking-tighter text-sm md:text-base">
            Poetic Engineer // Lab_Session
          </h1>
        </button>
        <button
          onClick={() => setIsReadingMode(!isReadingMode)}
          className={HEADER_BUTTON_CLASS}
        >
          {isReadingMode ? "← 3D VIEW" : "READING MODE →"}
        </button>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-center gap-4 pointer-events-auto">
        {/* Page title — fades in on page change via key trick */}
        <span
          key={page}
          className={`page-title-fade text-[11px] uppercase tracking-[0.2em] font-bold opacity-80 ${isReadingMode ? "text-white" : "text-[#002366]"}`}
        >
          {currentTitle}
        </span>

        {/* INDEX button + Progress bar */}
        <div className="flex items-center gap-3 w-full max-w-xl">
          {/* INDEX toggle — left side */}
          <button
            onClick={() => setIndexOpen(!indexOpen)}
            className={`px-3 py-1 border-2 font-bold text-xs uppercase tracking-widest transition-all flex-shrink-0 ${getIndexButtonClass(
              isReadingMode,
              indexOpen,
            )}`}
          >
            ▦ INDEX
          </button>

          {/* Progress bar */}
          <div className="flex-1 flex gap-[3px] h-8 items-end">
            {Array.from({ length: pages.length + 1 }).map((_, idx) => {
              const isActive = idx === page;
              const isFilled = idx < page;
              return (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  title={pages[Math.min(idx, pages.length - 1)]?.title}
                  className={`progress-segment flex-1 rounded-sm transition-all duration-200 ${getProgressSegmentClass(
                    isReadingMode,
                    isActive,
                    isFilled,
                  )}`}
                />
              );
            })}
          </div>
        </div>

        {/* Keyboard hint */}
        <span className={`text-[9px] uppercase tracking-widest ${isReadingMode ? "text-white/50" : "text-[#002366]/50"}`}>
          ← → keys to navigate
        </span>
      </div>
    </main>
  );
};
