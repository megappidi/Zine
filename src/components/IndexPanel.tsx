import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { indexOpenAtom, pageAtom, pages } from "./UI";

// ─── Build spread entries dynamically from pages array ────────────────────────
// Each "spread" = what you see when the book is open at state N:
//   left page  = pages[N-1].back
//   right page = pages[N].front
// This auto-scales when more pages are added later.

type CoverEntry = {
  type: "cover";
  pageState: number;
  texture: string;
  label: string;
};

type SpreadEntry = {
  type: "spread";
  pageState: number;
  spreadNumber: number;
  leftTexture: string;
  rightTexture: string;
  label: string;
};

type BackCoverEntry = {
  type: "backcover";
  pageState: number;
  texture: string;
  label: string;
};

type IndexEntry = CoverEntry | SpreadEntry | BackCoverEntry;

function buildIndexEntries(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  // Cover — closed book front
  entries.push({
    type: "cover",
    pageState: 0,
    texture: pages[0].front,
    label: pages[0].title,
  });

  // Interior spreads — one entry per open-book state
  for (let i = 1; i < pages.length; i++) {
    entries.push({
      type: "spread",
      pageState: i,
      spreadNumber: i,
      leftTexture: pages[i - 1].back,
      rightTexture: pages[i].front,
      label: `Spread ${String(i).padStart(2, "0")}`,
    });
  }

  // Back cover — closed book back
  entries.push({
    type: "backcover",
    pageState: pages.length,
    texture: pages[pages.length - 1].back,
    label: pages[pages.length - 1].title,
  });

  return entries;
}

const indexEntries = buildIndexEntries();

// ─── Component ────────────────────────────────────────────────────────────────

export const IndexPanel = () => {
  const [indexOpen, setIndexOpen] = useAtom(indexOpenAtom);
  const [page, setPage] = useAtom(pageAtom);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (indexOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [indexOpen]);

  const handleSelect = (pageState: number) => {
    setPage(pageState);
    setIndexOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[7] transition-opacity duration-300 ${
          indexOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIndexOpen(false)}
        aria-hidden="true"
      />

      {/* Left sidebar panel — starts below the header bar so it never overlaps it */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Page Index"
        tabIndex={-1}
        className={`index-panel fixed left-0 w-[300px] z-[9] bg-[#002366] text-white flex flex-col outline-none ${
          indexOpen ? "open" : ""
        }`}
        style={{ top: 80, height: "calc(100vh - 80px)" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/20">
          <span className="font-mono font-bold uppercase tracking-[0.2em] text-sm">
            ▦ Index
          </span>
          <button
            onClick={() => setIndexOpen(false)}
            className="text-white/60 hover:text-white text-xl leading-none transition-colors"
            aria-label="Close index"
          >
            ✕
          </button>
        </div>

        {/* Scrollable entries */}
        <div className="flex-1 overflow-y-auto py-2">
          {indexEntries.map((entry) => {
            const isActive = entry.pageState === page;

            return (
              <button
                key={entry.pageState}
                onClick={() => handleSelect(entry.pageState)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/10 focus:outline-none focus-visible:bg-white/10 border-l-2 ${
                  isActive
                    ? "bg-white/10 border-white"
                    : "border-transparent"
                }`}
              >
                {/* Thumbnail(s) */}
                {entry.type === "cover" || entry.type === "backcover" ? (
                  /* Single thumbnail for cover / back cover */
                  <div className="w-[52px] h-[68px] flex-shrink-0 overflow-hidden bg-white/10 rounded-sm">
                    <img
                      src={`/textures/${entry.texture}.jpg`}
                      alt={entry.label}
                      className="w-full h-full object-cover opacity-90"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  /* Two thumbnails side-by-side for spreads */
                  <div className="flex gap-[2px] flex-shrink-0">
                    <div className="w-[38px] h-[52px] overflow-hidden bg-white/10 rounded-l-sm">
                      <img
                        src={`/textures/${entry.leftTexture}.jpg`}
                        alt="left page"
                        className="w-full h-full object-cover opacity-90"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-[38px] h-[52px] overflow-hidden bg-white/10 rounded-r-sm">
                      <img
                        src={`/textures/${entry.rightTexture}.jpg`}
                        alt="right page"
                        className="w-full h-full object-cover opacity-90"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {/* Label */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-mono font-bold uppercase text-[11px] tracking-[0.15em] leading-tight">
                    {entry.label}
                  </span>
                  {entry.type === "spread" && (
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                      2 pages
                    </span>
                  )}
                </div>

                {/* Active dot */}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/20">
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            {pages.length - 1} spreads · ESC to close
          </span>
        </div>
      </div>
    </>
  );
};
