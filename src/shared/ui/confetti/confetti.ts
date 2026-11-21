const COLORS = ["#2563eb", "#60a5fa", "#bfdbfe", "#c58b2c", "#4ade80", "#f472b6"];

/** Yengil konfetti effekti (kutubxonasiz). `prefers-reduced-motion` da ishlamaydi. */
export function launchConfetti({ particles = 140, duration = 2600 } = {}) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "100" });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();

  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const w = window.innerWidth;
  const pieces = Array.from({ length: particles }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? w * 0.15 : w * 0.85,
      y: window.innerHeight * 0.35,
      vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 7),
      vy: -(6 + Math.random() * 9),
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[i % COLORS.length],
    };
  });

  const start = performance.now();
  const frame = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
    for (const p of pieces) {
      p.vy += 0.28;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
