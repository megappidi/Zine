import { useAtom } from "jotai";
import { pageAtom, pages } from "./UI";

export const ReadingMode = () => {
  const [page, setPage] = useAtom(pageAtom);

  return (
    <div className="rm-overlay">
      <button
        className={`rm-nav${page <= 0 ? " rm-nav--hidden" : ""}`}
        onClick={() => setPage(Math.max(0, page - 1))}
        aria-label="Previous page"
      >
        &#8249;
      </button>

      <span className="rm-page-info">
        {page} / {pages.length}
      </span>

      <button
        className={`rm-nav${page >= pages.length ? " rm-nav--hidden" : ""}`}
        onClick={() => setPage(Math.min(pages.length, page + 1))}
        aria-label="Next page"
      >
        &#8250;
      </button>
    </div>
  );
};
