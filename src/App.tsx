import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useAtom } from "jotai";
import { Experience } from "./components/Experience";
import { UI, modeAtom } from "./components/UI";
import { ReadingMode } from "./components/ReadingMode";
import { IndexPanel } from "./components/IndexPanel";


function App() {
  const [isReadingMode] = useAtom(modeAtom);

  return (
    <>
      
      <UI />
      <Loader />
      {/* Always mounted so CSS slide animation works on close */}
      <IndexPanel />
      {/* Reading mode overlay: prev/next nav rendered on top of the 3D canvas */}
      {isReadingMode && <ReadingMode />}
      {/* Canvas stops 170px above bottom so the 3D scene never hides behind the footer UI */}
      <div className="fixed inset-0" style={{ bottom: 170, pointerEvents: 'all' }}>
        <Canvas shadows camera={{ position: [-0.5, 0, 4], fov: 55 }} gl={{ alpha: true }} style={{ background: "transparent" }}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

export default App;
