import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { skyAtom } from "./UI";

// ─── Shaders ──────────────────────────────────────────────────────────────────

const VS = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FS = `
precision mediump float;
uniform float u_time;
uniform vec2  u_res;

const float cloudscale = 1.0;
const float speed      = 0.03;
const float clouddark  = 0.5;
const float cloudlight = 0.35;
const float cloudcover = 0.18;
const float cloudalpha = 5.5;
const float skytint    = 0.5;

const vec3 skycolour1 = vec3(0.34, 0.30, 0.62);
const vec3 skycolour2 = vec3(0.92, 0.68, 0.54);
const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

vec2 hash(vec2 p) {
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float noise(in vec2 p) {
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x+p.y)*K1);
  vec2 a = p - i + (i.x+i.y)*K2;
  vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec2 b = a - o + K2;
  vec2 c2 = a - 1.0 + 2.0*K2;
  vec3 h = max(0.5 - vec3(dot(a,a),dot(b,b),dot(c2,c2)), 0.0);
  vec3 n = h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c2,hash(i+1.0)));
  return dot(n, vec3(70.0));
}
float fbm(vec2 n) {
  float total = 0.0, amplitude = 0.1;
  for (int i = 0; i < 7; i++) {
    total += noise(n) * amplitude;
    n = m * n;
    amplitude *= 0.4;
  }
  return total;
}

void main() {
  vec2 p    = gl_FragCoord.xy / u_res.xy;
  vec2 ar   = vec2(u_res.x/u_res.y * 0.75, 1.85);
  vec2 uv   = p * ar;
  float time = u_time * speed;
  float q   = fbm(uv * cloudscale * 0.5);

  float r = 0.0;
  vec2 uv2 = uv * cloudscale - q - time;
  float weight = 0.8;
  for (int i = 0; i < 8; i++) {
    r += abs(weight * noise(uv2));
    uv2 = m * uv2 + time;
    weight *= 0.7;
  }

  float f = 0.0;
  uv2 = p * ar * cloudscale - q - time;
  weight = 0.7;
  for (int i = 0; i < 8; i++) {
    f += weight * noise(uv2);
    uv2 = m * uv2 + time;
    weight *= 0.6;
  }
  f *= r + f;

  float c = 0.0;
  float t2 = u_time * speed * 2.0;
  uv2 = p * ar * cloudscale * 2.0 - q - t2;
  weight = 0.4;
  for (int i = 0; i < 7; i++) {
    c += weight * noise(uv2);
    uv2 = m * uv2 + t2;
    weight *= 0.6;
  }

  float c1 = 0.0;
  float t3 = u_time * speed * 3.0;
  uv2 = p * ar * cloudscale * 3.0 - q - t3;
  weight = 0.4;
  for (int i = 0; i < 7; i++) {
    c1 += abs(weight * noise(uv2));
    uv2 = m * uv2 + t3;
    weight *= 0.6;
  }
  c += c1;

  vec3 skycolour   = mix(skycolour2, skycolour1, p.y);
  vec3 cloudcolour = vec3(1.08, 0.88, 0.90) * clamp(clouddark + cloudlight*c, 0.0, 1.0);

  f = cloudcover + cloudalpha * f * r;
  float cloudMix = clamp(f + c, 0.0, 1.0) * smoothstep(0.0, 0.10, p.y);
  vec3 result = mix(skycolour, clamp(skytint*skycolour + cloudcolour, 0.0, 1.0), cloudMix);

  vec2 uv3 = p * vec2(u_res.x/u_res.y * 1.2, 3.5) + vec2(u_time * speed * 0.6, 0.0);
  float wisp = fbm(uv3 * 1.8 + q);
  float wispMask = smoothstep(0.48, 0.58, wisp) * smoothstep(0.0, 0.40, p.y) * 0.35;
  vec3 wispCol = mix(skycolour1, vec3(1.0, 0.88, 0.92), 0.5);
  result = mix(result, wispCol, wispMask);

  float sd = length(p - vec2(0.48, 0.05));
  result += vec3(1.00, 0.96, 0.75) * exp(-sd * 11.0) * 0.55;
  result += vec3(1.00, 0.80, 0.48) * exp(-sd *  3.0) * 0.22;
  result += vec3(0.95, 0.60, 0.30) * exp(-sd *  1.1) * 0.08;

  gl_FragColor = vec4(result, 1.0);
}
`;

// ─── Hole punch ───────────────────────────────────────────────────────────────

const LIFETIME = 7000;
const FADE_AT  = 4500;

type Hole = { x: number; y: number; r: number; born: number };

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha: number) {
  const inner = r * 0.42;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI / 5) - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    i === 0
      ? ctx.moveTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad)
      : ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BackgroundProps {
  isReadingMode: boolean;
}

export const Background = ({ isReadingMode }: BackgroundProps) => {
  const glCanvasRef    = useRef<HTMLCanvasElement>(null);
  const overCanvasRef  = useRef<HTMLCanvasElement>(null);
  const hintRef        = useRef<HTMLDivElement>(null);
  const holesRef       = useRef<Hole[]>([]);
  const modeRef        = useRef(isReadingMode);
  const hintHiddenRef  = useRef(false);
  const [skyVisible]   = useAtom(skyAtom);
  const skyRef         = useRef(skyVisible);
  const updateSkyLoopRef = useRef<() => void>(() => {});

  useEffect(() => { modeRef.current = isReadingMode; }, [isReadingMode]);
  useEffect(() => { skyRef.current = skyVisible; }, [skyVisible]);

  // WebGL sky
  useEffect(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_res");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const t0 = performance.now();
    let rafId: number;
    let running = false;

    const draw = () => {
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const tick = () => {
      if (!running) return;
      draw();
      rafId = requestAnimationFrame(tick);
    };

    const updateLoop = () => {
      const shouldRun = (skyRef.current || holesRef.current.length > 0) && !document.hidden;
      if (shouldRun === running) return;
      running = shouldRun;

      if (running) {
        draw();
        rafId = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafId);
      }
    };

    updateSkyLoopRef.current = updateLoop;
    updateLoop();
    document.addEventListener("visibilitychange", updateLoop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      updateSkyLoopRef.current = () => {};
      document.removeEventListener("visibilitychange", updateLoop);
      window.removeEventListener("resize", resize);
    };
  }, [skyVisible]);

  // Paper overlay + hole punch
  useEffect(() => {
    const canvas = overCanvasRef.current;
    const hint   = hintRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const hideHint = () => {
      if (hint && !hintHiddenRef.current) {
        hint.style.opacity = "0";
        hintHiddenRef.current = true;
      }
    };
    const hintTimer = setTimeout(hideHint, 18000);

    let rafId = 0;
    let isRendering = false;

    const render = () => {
      const now = performance.now();
      const { width: w, height: h } = canvas;

      holesRef.current = holesRef.current.filter(hole => now - hole.born < LIFETIME);

      ctx.clearRect(0, 0, w, h);
      if (!skyRef.current) {
        ctx.fillStyle = modeRef.current ? "#0a1628" : "#D1DFEB";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = "destination-out";
      for (const hole of holesRef.current) {
        const age   = now - hole.born;
        const alpha = age > FADE_AT
          ? Math.max(0, 1 - (age - FADE_AT) / (LIFETIME - FADE_AT))
          : 1;
        drawStar(ctx, hole.x, hole.y, hole.r, alpha);
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = () => {
      render();
      updateSkyLoopRef.current();

      if (holesRef.current.length > 0 && !document.hidden) {
        rafId = requestAnimationFrame(tick);
      } else {
        isRendering = false;
      }
    };

    const ensureRendering = () => {
      if (isRendering) return;
      isRendering = true;
      rafId = requestAnimationFrame(tick);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      holesRef.current.push({
        x: (e.clientX - rect.left) * (canvas.width  / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height),
        r: 5 + Math.random() * 18,
        born: performance.now(),
      });
      hideHint();
      ensureRendering();
      updateSkyLoopRef.current();
    };
    window.addEventListener("click", onClick);

    const handleVisibilityChange = () => {
      if (!document.hidden && holesRef.current.length > 0) {
        ensureRendering();
      } else {
        render();
      }
      updateSkyLoopRef.current();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    render();

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(hintTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
    };
  }, [isReadingMode, skyVisible]);

  return (
    <>
      <style>{`
        @keyframes floatHint {
          0%, 100% { transform: translateY(-50%); }
          50%       { transform: translateY(calc(-50% - 7px)); }
        }
      `}</style>
      <canvas
        ref={glCanvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 0, display: "block", pointerEvents: "none" }}
      />
      <canvas
        ref={overCanvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 1, display: "block", pointerEvents: "none" }}
      />
      <div
        ref={hintRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "6%",
          animation: "floatHint 2.8s ease-in-out infinite",
          zIndex: 11,
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "lowercase",
          color: isReadingMode ? "rgba(255,255,255,0.55)" : "rgba(0,35,102,0.55)",
          pointerEvents: "none",
          transition: "opacity 0.8s ease",
        }}
      >
        click for surprise
      </div>
    </>
  );
};
