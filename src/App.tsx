import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useAtom } from "jotai";
import { Background } from "./components/Background";
import { Experience } from "./components/Experience";
import { UI, modeAtom } from "./components/UI";
import { ReadingMode } from "./components/ReadingMode";
import { IndexPanel } from "./components/IndexPanel";
import AudioPlayer from "./components/AudioPlayer";


function App() {
  const [isReadingMode] = useAtom(modeAtom);

  return (
    <>
      <Background isReadingMode={isReadingMode} />
      <UI />
      <Loader />
      {/* Always mounted so CSS slide animation works on close */}
      <IndexPanel />
      {/* Reading mode overlay: prev/next nav rendered on top of the 3D canvas */}
      {isReadingMode && <ReadingMode />}
      <AudioPlayer />
      {/* Canvas stops above the footer UI so the 3D scene never hides behind the player */}
      <div className="app-scene fixed inset-0" style={{ pointerEvents: 'all', zIndex: 2, display: isReadingMode ? 'none' : 'block' }}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          frameloop={isReadingMode ? "never" : "always"}
          camera={{ position: [-0.5, 0, 4], fov: 55 }}
          gl={{ alpha: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

export default App;
