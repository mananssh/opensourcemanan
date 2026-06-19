import { ScrambleText } from "@/components/portfolio/hero/scramble-text";
import { SullyPanel } from "@/components/portfolio/agent/sully-panel";

/** Placeholder Sully avatar. TODO: swap to <Image src="/sully.png"> once added to /public. */
function SullyAvatar() {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#0a0d0c] font-display text-3xl font-semibold text-[#34f5a0] ring-2 ring-[#34f5a0]/70">
      S
    </div>
  );
}

export function SullySection() {
  return (
    <section id="sully" className="mx-auto mt-28 w-full max-w-5xl px-6 scroll-mt-20">
      <ScrambleText
        text="● a (slightly biased) second opinion"
        className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent"
      />
      <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        <span className="text-muted">Everyone can talk about what they do.</span>
        <br />
        <span className="font-semibold text-ink">Let me show you instead.</span>
      </h2>

      <div className="mt-7 flex items-start gap-5">
        <SullyAvatar />
        <p className="max-w-2xl font-body text-lg leading-relaxed text-muted">
          Meet <span className="font-medium text-ink">Sully</span>, my autopilot —
          he&rsquo;s read everything I&rsquo;ve built. Paste a role you&rsquo;re
          hiring for and he&rsquo;ll map it to my background in real time, then land
          an honest verdict: strong fit or not, and why. He&rsquo;s biased,
          obviously — but only a little.
        </p>
      </div>

      <div className="mt-8">
        <SullyPanel />
      </div>
    </section>
  );
}
