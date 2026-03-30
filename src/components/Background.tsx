import { useEffect, useRef } from "react";

// ─── WebGL shader source ──────────────────────────────────────────────────────

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform float iTime;
uniform vec2  iResolution;

// 2D value noise
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),           hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

// 4-octave FBM
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2  shift = vec2(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p  = p * 2.1 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv.y = 1.0 - uv.y; // flip Y

  float t = iTime * 0.10;

  // Two layers of fbm at slightly different offsets for organic feel
  float n1 = fbm(uv * 2.8 + t);
  float n2 = fbm(uv * 1.6 - t * 0.6 + vec2(3.4, 1.7));
  float n  = n1 * 0.65 + n2 * 0.35;

  // Base colour #D1DFEB = (0.820, 0.875, 0.922)
  // Warm shift   #D9E4EC = (0.851, 0.894, 0.925)
  // Cool shift   #C8D8E8 = (0.784, 0.847, 0.910)
  vec3 base  = vec3(0.820, 0.875, 0.922);
  vec3 warm  = vec3(0.851, 0.894, 0.925);
  vec3 cool  = vec3(0.784, 0.847, 0.910);

  vec3 color = mix(cool, warm, n);
  // Keep contrast very low — this is texture, not art
  color = mix(base, color, 0.38);

  gl_FragColor = vec4(color, 1.0);
}
`;

// ─── Shape drawing helpers ────────────────────────────────────────────────────

type ShapeType = "star5" | "flower" | "burst" | "diamond" | "snowflake" | "clover";

const SHAPE_TYPES: ShapeType[] = ["star5", "flower", "burst", "diamond", "snowflake", "clover"];

function drawShape(ctx: CanvasRenderingContext2D, type: ShapeType, size: number) {
  ctx.beginPath();
  switch (type) {
    case "star5": {
      const outer = size;
      const inner = size * 0.42;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
                : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      break;
    }
    case "flower": {
      const petals = 6;
      const pr = size * 0.52;
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        const cx = Math.cos(angle) * pr * 0.55;
        const cy = Math.sin(angle) * pr * 0.55;
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, pr * 0.48, 0, Math.PI * 2);
      }
      // Centre circle
      ctx.moveTo(size * 0.22, 0);
      ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
      break;
    }
    case "burst": {
      const spikes = 12;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? size : size * 0.28;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
                : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      break;
    }
    case "diamond": {
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.6, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.6, 0);
      ctx.closePath();
      break;
    }
    case "snowflake": {
      const arms = 6;
      for (let i = 0; i < arms; i++) {
        const angle = (i / arms) * Math.PI * 2;
        const ex = Math.cos(angle) * size;
        const ey = Math.sin(angle) * size;
        ctx.moveTo(0, 0);
        ctx.lineTo(ex, ey);
        // Two small branches per arm
        const branchLen = size * 0.38;
        const b1a = angle + Math.PI / 4;
        const b2a = angle - Math.PI / 4;
        const mid = 0.55;
        ctx.moveTo(Math.cos(angle) * size * mid, Math.sin(angle) * size * mid);
        ctx.lineTo(
          Math.cos(angle) * size * mid + Math.cos(b1a) * branchLen,
          Math.sin(angle) * size * mid + Math.sin(b1a) * branchLen
        );
        ctx.moveTo(Math.cos(angle) * size * mid, Math.sin(angle) * size * mid);
        ctx.lineTo(
          Math.cos(angle) * size * mid + Math.cos(b2a) * branchLen,
          Math.sin(angle) * size * mid + Math.sin(b2a) * branchLen
        );
      }
      break;
    }
    case "clover": {
      const dirs = 4;
      const cr = size * 0.5;
      for (let i = 0; i < dirs; i++) {
        const angle = (i / dirs) * Math.PI * 2;
        const cx = Math.cos(angle) * cr * 0.65;
        const cy = Math.sin(angle) * cr * 0.65;
        ctx.moveTo(cx + cr, cy);
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      }
      ctx.moveTo(size * 0.18, 0);
      ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
      break;
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Shape = {
  x: number;
  y: number;
  type: ShapeType;
  size: number;
  born: number;
  duration: number;
  rotation: number;
  color: string;
  useStroke: boolean; // some shapes look better stroked
};

// ─── WebGL helper ─────────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SHAPE_COLORS = ["#002366", "#002366", "#002366", "#8B6914"]; // 3:1 navy to gold

export const Background = () => {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const shapeCanvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // ── WebGL setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return; // graceful fallback — #root background colour shows

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "iTime");
    const uRes  = gl.getUniformLocation(prog, "iResolution");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId: number;
    const tick = (t: number) => {
      rafId = requestAnimationFrame(tick);
      gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Canvas 2D click shapes ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = shapeCanvasRef.current;
    const hint   = hintRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let shapes: Shape[] = [];
    let rafId: number;
    let clickCount = 0;
    let showHint = true;

    // Hide hint after 5s or first click
    const hintTimer = setTimeout(() => {
      showHint = false;
      if (hint) hint.style.opacity = "0";
    }, 5000);

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onClick = (e: MouseEvent) => {
      clickCount++;
      if (showHint) {
        showHint = false;
        if (hint) hint.style.opacity = "0";
      }

      const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
      const color = SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];
      const isStroke = type === "snowflake" || Math.random() < 0.3;

      shapes.push({
        x: e.clientX,
        y: e.clientY,
        type,
        size: 42 + Math.random() * 46,
        born: performance.now(),
        duration: 1600 + Math.random() * 600,
        rotation: Math.random() * Math.PI * 2,
        color,
        useStroke: isStroke,
      });

      // Keep max 24 shapes alive at once
      if (shapes.length > 24) shapes = shapes.slice(-24);
    };
    window.addEventListener("click", onClick);

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      shapes = shapes.filter((s) => now - s.born < s.duration);

      for (const s of shapes) {
        const t = (now - s.born) / s.duration; // 0 → 1
        const scale  = t < 0.18 ? t / 0.18 : 1;
        const alpha  = t > 0.5  ? 1 - (t - 0.5) / 0.5 : 1;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation + t * 0.4);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha * 0.82;

        drawShape(ctx, s.type, s.size);

        if (s.useStroke || s.type === "snowflake") {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.type === "snowflake" ? 1.8 : 1.4;
          ctx.stroke();
        } else {
          ctx.fillStyle = s.color;
          ctx.fill();
        }

        ctx.restore();
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(hintTimer);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* WebGL noise shader — bottom layer */}
      <canvas
        ref={glCanvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 0, display: "block", pointerEvents: "none" }}
      />

      {/* Canvas 2D click shapes — above shader, below everything else */}
      <canvas
        ref={shapeCanvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 1, display: "block", pointerEvents: "none" }}
      />

      {/* "Click anywhere" hint — fades away after first click or 5s */}
      <div
        ref={hintRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 190,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          fontFamily: "'Courier New', monospace",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#002366",
          opacity: 0.38,
          pointerEvents: "none",
          transition: "opacity 0.8s ease",
          animation: "hintPulse 2.4s ease-in-out infinite",
        }}
      >
        click anywhere ✦
      </div>

      <style>{`
        @keyframes hintPulse {
          0%, 100% { opacity: 0.38; }
          50%       { opacity: 0.15; }
        }
      `}</style>
    </>
  );
};
