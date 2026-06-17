"use client";

import { useEffect, useState } from "react";

/**
 * Reading polish for post pages: a top scroll-progress bar, a scroll-to-top
 * button, and copy buttons injected onto code blocks (operates on the
 * server-rendered .blog-prose DOM).
 */
export function PostReadingUx() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
      setShowTop(el.scrollTop > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const pres = document.querySelectorAll<HTMLElement>(".blog-prose pre");
    const buttons: HTMLButtonElement[] = [];
    pres.forEach((pre) => {
      if (pre.dataset.copyReady) return;
      pre.dataset.copyReady = "1";
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Copy";
      btn.className = "code-copy-btn";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "Copied";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 1500);
        } catch {
          /* clipboard unavailable */
        }
      });
      pre.appendChild(btn);
      buttons.push(btn);
    });
    return () => buttons.forEach((b) => b.remove());
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-0.5">
        <div
          className="h-full bg-accent"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-surface text-ink shadow-md transition-colors hover:border-accent hover:text-accent"
        >
          ↑
        </button>
      )}
    </>
  );
}
