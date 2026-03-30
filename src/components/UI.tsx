import { atom, useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

export type PageData = {
  front: string;
  back: string;
  title: string;
};

const pictures: string[] = [
  "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27",
];

export const pageAtom = atom<number>(0);
export const modeAtom = atom<boolean>(false); // false = 3D, true = Reading
export const indexOpenAtom = atom<boolean>(false);

const pageTitles = [
  "Cover",
  "Chapter 01",
  "Chapter 02",
  "Chapter 03",
  "Chapter 04",
  "Chapter 05",
  "Back Cover",
];

export const pages: PageData[] = [];
for (let i = 0; i < pictures.length; i += 2) {
  pages.push({
    front: pictures[i],
    back: pictures[i + 1],
    title: pageTitles[i / 2] ?? `Page ${i / 2 + 1}`,
  });
}

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const [isReadingMode, setIsReadingMode] = useAtom(modeAtom);
  const [indexOpen, setIndexOpen] = useAtom(indexOpenAtom);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/podcast.mp3");
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(pages.length, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
      if (e.key === "Escape") setIndexOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // jotai setters are stable — no deps needed

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          console.warn("podcast.mp3 not found in /public");
        });
    }
  };

  const currentTitle = pages[Math.min(page, pages.length - 1)]?.title ?? "";

  return (
    <main className="fixed inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-8 font-mono">
      {/* HEADER */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-[#002366] text-white p-3 border-2 border-white shadow-lg">
          <h1 className="font-bold uppercase tracking-tighter text-sm md:text-base">
            Poetic Engineer // Lab_Session
          </h1>
        </div>
        <button
          onClick={() => setIsReadingMode(!isReadingMode)}
          className="bg-white text-[#002366] px-6 py-2 border-2 border-[#002366] font-bold hover:bg-[#002366] hover:text-white transition-all shadow-[4px_4px_0px_#002366]"
        >
          {isReadingMode ? "← 3D VIEW" : "READING MODE →"}
        </button>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-center gap-4 pointer-events-auto">
        {/* Podcast player */}
        <div className="bg-[#002366] text-white p-4 border-2 border-white shadow-2xl flex items-center gap-6">
          <button
            onClick={toggleAudio}
            className="text-2xl hover:scale-110 transition-transform"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-60">
              NotebookLM Audio
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Manifesto_Deep_Dive.mp3
            </span>
          </div>
          <div className="flex gap-1 items-end h-4">
            <div
              className={`w-1 bg-white ${isPlaying ? "animate-bounce" : ""}`}
              style={{ height: "60%" }}
            />
            <div
              className={`w-1 bg-white ${isPlaying ? "animate-bounce delay-75" : ""}`}
              style={{ height: "100%" }}
            />
            <div
              className={`w-1 bg-white ${isPlaying ? "animate-bounce delay-150" : ""}`}
              style={{ height: "40%" }}
            />
          </div>
        </div>

        {/* Page title — fades in on page change via key trick */}
        <span
          key={page}
          className="page-title-fade text-[11px] uppercase tracking-[0.2em] text-[#002366] font-bold opacity-80"
        >
          {currentTitle}
        </span>

        {/* INDEX button + Progress bar */}
        <div className="flex items-center gap-3 w-full max-w-xl">
          {/* INDEX toggle — left side */}
          <button
            onClick={() => setIndexOpen(!indexOpen)}
            className={`px-3 py-1 border-2 font-bold text-xs uppercase tracking-widest transition-all flex-shrink-0 ${
              indexOpen
                ? "bg-[#002366] text-white border-[#002366]"
                : "bg-white text-[#002366] border-[#002366] hover:bg-[#002366] hover:text-white"
            }`}
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
                  className={`progress-segment flex-1 rounded-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[#002366] h-full"
                      : isFilled
                      ? "bg-[#002366]/60 h-3/4"
                      : "bg-[#002366]/20 h-1/2 hover:bg-[#002366]/40 hover:h-3/4"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Keyboard hint */}
        <span className="text-[9px] uppercase tracking-widest text-[#002366]/50">
          ← → keys to navigate
        </span>
      </div>
    </main>
  );
};
