import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { FlipBook } from "../lib/flipbook/FlipBook";
import { pageAtom, pages } from "./UI";

const pageSources = pages.flatMap((p) => [
  `/textures/${p.front}.jpg`,
  `/textures/${p.back}.jpg`,
]);

const MAX_PAGE_STATE = pages.length;
const READING_CAMERA = { position: [0, 0, 5] as const, zoom: 130 };

function clampPage(page: number) {
  return Math.max(0, Math.min(MAX_PAGE_STATE, page));
}

const FlipScene = () => {
  const [page] = useAtom(pageAtom);
  const bookRef = useRef<FlipBook | null>(null);
  const { scene, gl, camera } = useThree();

  useEffect(() => {
    gl.setClearColor(0x000000, 0);

    // Camera: slightly above and in front — same angle as the demo
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const book = new FlipBook({ flipDuration: 0.6, yBetweenPages: 0.001, pageSubdivisions: 20 });
    book.scale.set(1.7, 1.7, 1.7 * 1.315);
    book.rotation.x = Math.PI / 2;
    book.setPages(pageSources);
    scene.add(book);
    bookRef.current = book;

    return () => {
      scene.remove(book);
      book.dispose();
    };
  }, [scene, gl, camera]);

  // pageAtom 0–7 maps to FlipBook currentPage 0–14 (each sheet = 2 page numbers)
  useEffect(() => {
    if (bookRef.current) {
      bookRef.current.currentPage = page * 2;
    }
  }, [page]);

  useFrame((_, delta) => {
    bookRef.current?.animate(delta);
  });

  return (
    <>
      <ambientLight intensity={2.5} />
      <directionalLight position={[0.3, 1, 0.5]} intensity={1} />
      <OrbitControls enableRotate={false} enablePan={false} minZoom={60} maxZoom={500} />
    </>
  );
};

export const ReadingMode = () => {
  const [page, setPage] = useAtom(pageAtom);

  return (
    <div className="rm-overlay">
      <button
        className={`rm-nav${page <= 0 ? " rm-nav--hidden" : ""}`}
        onClick={() => setPage(clampPage(page - 1))}
        aria-label="Previous page"
      >
        &#8249;
      </button>

      <div
        className="rm-spread"
        onClick={(e) => {
          const { left, width } = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const isRightHalf = e.clientX - left > width / 2;
          if (isRightHalf) setPage((p) => clampPage(p + 1));
          else setPage((p) => clampPage(p - 1));
        }}
        style={{ cursor: "pointer" }}
      >
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          camera={READING_CAMERA}
          gl={{ alpha: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <FlipScene />
        </Canvas>
      </div>

      <button
        className={`rm-nav${page >= pages.length ? " rm-nav--hidden" : ""}`}
        onClick={() => setPage(clampPage(page + 1))}
        aria-label="Next page"
      >
        &#8250;
      </button>
    </div>
  );
};
