"use client";

import { useEffect, useRef } from "react";

/**
 * "Signal field" — a visible particle network that reacts to the cursor (repel +
 * accent tint nearby) and to page scroll (parallax drift, wrapping). Lines link
 * nearby particles so it reads as a network, not stray dots. Retokenized via CSS
 * vars; static + listener-free under reduced motion; paused offscreen/hidden;
 * count capped for perf.
 */
export function Particles({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cs = getComputedStyle(canvas);
    // Fallbacks match the light-theme values (the safer default if the CSS
    // var ever fails to resolve) — never a dark-only color, per ADR 0005.
    const dotColor = (cs.getPropertyValue("--muted") || "#57575c").trim();
    const accent = (cs.getPropertyValue("--accent") || "#cc3a2d").trim();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];
    const mouse = { x: -9999, y: -9999 };
    const R = 130; // cursor influence
    const LINK = 86; // link distance

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.round((w * h) / 6000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const shift = (window.scrollY || 0) * 0.05;
      const rs = pts.map((p) => {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x += w;
          if (p.x > w) p.x -= w;
          if (p.y < 0) p.y += h;
          if (p.y > h) p.y -= h;
        }
        let rx = p.x;
        let ry = (((p.y - shift) % h) + h) % h;
        const dx = rx - mouse.x;
        const dy = ry - mouse.y;
        const d2 = dx * dx + dy * dy;
        let near = 0;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          near = 1 - d / R;
          rx += (dx / d) * near * 16;
          ry += (dy / d) * near * 16;
        }
        return { x: rx, y: ry, near };
      });

      // links
      ctx!.lineWidth = 1;
      ctx!.strokeStyle = dotColor;
      for (let i = 0; i < rs.length; i++) {
        for (let j = i + 1; j < rs.length; j++) {
          const dx = rs[i].x - rs[j].x;
          const dy = rs[i].y - rs[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx!.globalAlpha = (1 - d / LINK) * 0.16;
            ctx!.beginPath();
            ctx!.moveTo(rs[i].x, rs[i].y);
            ctx!.lineTo(rs[j].x, rs[j].y);
            ctx!.stroke();
          }
        }
      }

      // dots
      for (const r of rs) {
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, 1.3 + r.near * 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = r.near > 0.05 ? accent : dotColor;
        ctx!.globalAlpha = r.near > 0.05 ? 0.65 + r.near * 0.35 : 0.5;
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
