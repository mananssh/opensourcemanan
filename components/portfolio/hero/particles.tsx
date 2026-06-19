"use client";

import { useEffect, useRef } from "react";

/**
 * "Signal field" — a faint particle layer that reacts to the cursor (repel +
 * accent tint nearby) and to page scroll (subtle parallax drift). Retokenized to
 * the portfolio palette via CSS vars; static + listener-free under reduced motion;
 * paused when offscreen or the tab is hidden; particle count capped for perf.
 */
export function Particles({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cs = getComputedStyle(canvas);
    const dot = (cs.getPropertyValue("--faint") || "#7c7c82").trim();
    const accent = (cs.getPropertyValue("--accent") || "#ff5a4d").trim();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];
    const mouse = { x: -9999, y: -9999 };
    const R = 110; // cursor influence radius

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(80, Math.round((w * h) / 14000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const scrollShift = (window.scrollY || 0) * 0.04;
      for (const p of pts) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x += w;
          if (p.x > w) p.x -= w;
          if (p.y < 0) p.y += h;
          if (p.y > h) p.y -= h;
        }
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y + scrollShift;
        const d2 = dx * dx + dy * dy;
        let near = 0;
        let px = p.x;
        let py = p.y - scrollShift;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          near = 1 - d / R;
          px += (dx / d) * near * 14; // repel
          py += (dy / d) * near * 14;
        }
        ctx!.beginPath();
        ctx!.arc(px, py, 1.3 + near * 1.4, 0, Math.PI * 2);
        ctx!.fillStyle = near > 0.05 ? accent : dot;
        ctx!.globalAlpha = near > 0.05 ? 0.35 + near * 0.5 : 0.32;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    let raf = 0;
    let visible = true;
    const loop = () => {
      draw();
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onScroll = () => {
      if (reduced) draw();
    };

    resize();
    draw();
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    if (!reduced) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseout", onLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
