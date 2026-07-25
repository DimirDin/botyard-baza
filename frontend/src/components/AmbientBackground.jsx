import { useEffect, useRef, useState } from "react";
import { resolveVariant } from "../lib/background";
import { getAmbientEnabled } from "../lib/prefs";
import { createDust, stepDust } from "../lib/dust";

export function AmbientBackground({ screen }) {
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const enabled = getAmbientEnabled();
  const variant = resolveVariant({ screen, enabled, reducedMotion });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (variant !== "dust") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let particles = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createDust({ width, height });
    };

    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      stepDust(particles, dt, width, height);
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const x = p.x + Math.sin(p.phase) * p.sway * 14;
        const [r, g, b] = p.color;
        if (p.bokeh) {
          const grd = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
          grd.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grd;
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
        }
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [variant]);

  return (
    <div className={`ambient ambient--${variant}`} aria-hidden="true">
      <div className="ambient__wash">
        <i />
        <i />
      </div>
      <canvas className="ambient__canvas" ref={canvasRef} />
      <div className="ambient__grain" />
    </div>
  );
}
