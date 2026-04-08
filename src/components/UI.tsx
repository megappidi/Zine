import { atom, useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

export type PageData = {
  front: string;
  back: string;
  title: string;
};

const HEADER_BUTTON_CLASS =
  "app-header-button bg-white text-[#002366] px-4 py-2 md:px-6 border-2 border-[#002366] font-bold hover:bg-[#002366] hover:text-white transition-all shadow-[4px_4px_0px_#002366] flex items-center";

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
  const [infoOpen, setInfoOpen] = useState(false);
  const skyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => () => {
    if (skyTimerRef.current) clearTimeout(skyTimerRef.current);
  }, []);

  const handleTitleClick = () => {
    setSkyVisible(true);
    if (skyTimerRef.current) clearTimeout(skyTimerRef.current);
    skyTimerRef.current = setTimeout(() => setSkyVisible(false), 5000);
  };

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
  const showMobilePageTitle = !(isMobile && currentTitle === "Index");

  return (
    <main className="app-shell fixed inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 md:p-8 font-mono">
      {/* Info button */}
      <button
        onClick={() => setInfoOpen(true)}
        aria-label="About this experience"
        className="app-info-button pointer-events-auto"
        style={{
          position: "fixed",
          bottom: "var(--app-info-offset)",
          left: "var(--app-info-offset)",
          zIndex: 48,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "white",
          border: "2px solid #002366",
          color: "#002366",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 15,
          fontWeight: "bold",
          fontStyle: "italic",
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "2px 2px 0px #002366",
        }}
      >
        i
      </button>

      {/* Info modal */}
      {infoOpen && (
        <div
          onClick={() => setInfoOpen(false)}
          className="pointer-events-auto"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="app-modal-card"
            style={{
              background: "white",
              border: "2px solid #002366",
              boxShadow: "4px 4px 0px #002366",
              padding: "var(--app-modal-padding)",
              maxWidth: 460,
              width: "var(--app-modal-width)",
              fontFamily: "Helvetica, Arial, sans-serif",
              color: "#002366",
              position: "relative",
            }}
          >
            <button
              onClick={() => setInfoOpen(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#002366",
                lineHeight: 1,
                fontFamily: "Helvetica, Arial, sans-serif",
              }}
            >
              ×
            </button>

            <p style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: "bold", marginBottom: 20, opacity: 0.4 }}>
              Lab_Session — No. 001
            </p>

            <h2 style={{ fontSize: 22, fontWeight: "bold", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.01em" }}>
              A zine about<br />how I think.
            </h2>

            <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 10, opacity: 0.8 }}>
              A magazine felt like the most honest introduction I could give — so I built one. It's digital, but I kept the page flips and the spreads, the texture of moving through something physical.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 28, opacity: 0.8 }}>
              Flip through with the arrow keys, or toggle Reading Mode for a quieter read. There's a podcast in the corner too.
            </p>

            <p style={{ fontSize: 11, fontStyle: "italic", marginBottom: 28, opacity: 0.55 }}>— Meghana</p>

            <div style={{ borderTop: "1px solid rgba(0,35,102,0.12)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ul style={{ fontSize: 11, lineHeight: 2, listStyle: "none", padding: 0, margin: 0, opacity: 0.5 }}>
                <li><strong>← →</strong> &nbsp;flip pages &nbsp;·&nbsp; <strong>INDEX</strong> &nbsp;to jump &nbsp;·&nbsp; <strong>ESC</strong> &nbsp;to close</li>
              </ul>
              <a
                href="https://megappidi.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#002366",
                  color: "white",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: 10,
                  fontWeight: "bold",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "10px 18px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginLeft: 20,
                }}
              >
                Full Portfolio →
              </a>
            </div>
          </div>
        </div>
      )}
      <div className="app-top-bar flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start pointer-events-auto">
        <button onClick={handleTitleClick} className={HEADER_BUTTON_CLASS}>
          <h1 className="app-header-title w-full text-center font-bold uppercase tracking-tighter text-xs sm:text-sm md:text-base">
            Poetic Engineer // Lab_Session
          </h1>
        </button>

        <button onClick={() => setIsReadingMode(!isReadingMode)} className={HEADER_BUTTON_CLASS}>
          {isReadingMode ? "← 3D VIEW" : "READING MODE →"}
        </button>
      </div>

      <div className="app-footer-stack flex flex-col items-center gap-3 md:gap-4 pointer-events-auto">
        {showMobilePageTitle && (
          <span
            key={page}
            className={`page-title-fade text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold opacity-80 text-center ${isReadingMode ? "text-white" : "text-[#002366]"}`}
          >
            {currentTitle}
          </span>
        )}

        <div className="app-footer-progress flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-[340px] sm:max-w-xl">
          <button
            onClick={() => setIndexOpen(!indexOpen)}
            className={`px-3 py-1 border-2 font-bold text-xs uppercase tracking-widest transition-all flex-shrink-0 self-center sm:self-auto ${getIndexButtonClass(
              isReadingMode,
              indexOpen,
            )}`}
          >
            ▦ INDEX
          </button>

          <div className="flex-1 flex gap-[3px] h-6 sm:h-8 items-end">
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

        {isMobile ? (
          <span className={`max-w-[280px] text-center text-[9px] uppercase tracking-[0.16em] ${isReadingMode ? "text-white/55" : "text-[#002366]/55"}`}>
            Built for desktop experience. Some features are simplified on mobile view.
          </span>
        ) : (
          <span className={`text-[9px] uppercase tracking-widest ${isReadingMode ? "text-white/50" : "text-[#002366]/50"}`}>
            ← → keys to navigate
          </span>
        )}
      </div>
    </main>
  );
};
