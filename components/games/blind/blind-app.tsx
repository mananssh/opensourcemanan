"use client";

import { useCallback, useMemo, useState } from "react";
import { useReducedMotion, motion, AnimatePresence } from "motion/react";
import defaultPackJson from "@/content/games/blind/default-pack.json";
import { BlindHero } from "./blind-hero";
import type {
  BlindPack,
  BlindPhase,
  BlindPlayer,
  PlayerRole,
  WinnerFaction,
} from "@/lib/games/blind/types";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PACK_VERSION,
} from "@/lib/games/blind/types";
import {
  checkWinner,
  dealPlayers,
  eliminatePlayer,
  isValidPlayerCount,
  isValidUndercoverCount,
  maxUndercovers,
  pickRandomPair,
} from "@/lib/games/blind/rules";
import {
  downloadPackFile,
  parseBlindPack,
  parseBlindPackJson,
} from "@/lib/games/blind/pack-schema";

const stubParsed = parseBlindPack(defaultPackJson);
const DEFAULT_PACK: BlindPack = stubParsed.ok
  ? stubParsed.pack
  : { version: PACK_VERSION, title: "Blind stub", pairs: [] };

type ExtractStatus = "idle" | "parsing" | "extracting" | "error";

function newNameList(): string[] {
  return ["", "", ""];
}

export function BlindApp() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<BlindPhase>("hub");
  const [howOpen, setHowOpen] = useState(false);
  const [names, setNames] = useState<string[]>(newNameList);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [pack, setPack] = useState<BlindPack | null>(null);
  const [packFromChat, setPackFromChat] = useState(false);
  const [players, setPlayers] = useState<BlindPlayer[]>([]);
  const [dealIndex, setDealIndex] = useState(0);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [voteTarget, setVoteTarget] = useState<string | null>(null);
  const [lastEliminated, setLastEliminated] = useState<{
    name: string;
    role: PlayerRole;
  } | null>(null);
  const [winner, setWinner] = useState<WinnerFaction | null>(null);
  const [extractStatus, setExtractStatus] = useState<ExtractStatus>("idle");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filledNames = useMemo(
    () => names.map((n) => n.trim()).filter(Boolean),
    [names],
  );
  const playerCount = filledNames.length;
  const maxUc = maxUndercovers(playerCount);
  const setupValid =
    isValidPlayerCount(playerCount) &&
    isValidUndercoverCount(undercoverCount, playerCount) &&
    new Set(filledNames.map((n) => n.toLowerCase())).size === playerCount;

  const killSession = useCallback(() => {
    setPhase("hub");
    setHowOpen(false);
    setNames(newNameList());
    setUndercoverCount(1);
    setPack(null);
    setPackFromChat(false);
    setPlayers([]);
    setDealIndex(0);
    setWordRevealed(false);
    setSpeakerIndex(0);
    setVoteTarget(null);
    setLastEliminated(null);
    setWinner(null);
    setExtractStatus("idle");
    setExtractError(null);
    setLoadError(null);
  }, []);

  const startDeal = useCallback(
    (activePack: BlindPack) => {
      const pair = pickRandomPair(activePack);
      const dealt = dealPlayers(filledNames, undercoverCount, pair);
      setPlayers(dealt);
      setPack(activePack);
      setDealIndex(0);
      setWordRevealed(false);
      setPhase("deal-pass");
    },
    [filledNames, undercoverCount],
  );

  const useDefaultPack = () => {
    setPack(DEFAULT_PACK);
    setPackFromChat(false);
    startDeal(DEFAULT_PACK);
  };

  const onLoadPackFile = async (file: File) => {
    setLoadError(null);
    try {
      const text = await file.text();
      const result = parseBlindPackJson(text);
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setPack(result.pack);
      setPackFromChat(false);
      setPhase("review-pack");
    } catch {
      setLoadError("Could not read file");
    }
  };

  const onWhatsAppFile = async (file: File) => {
    setExtractError(null);
    setExtractStatus("parsing");
    try {
      const form = new FormData();
      form.append("file", file);
      setExtractStatus("extracting");
      const res = await fetch("/api/games/blind/extract", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as BlindPack & { error?: string };
      if (!res.ok) {
        setExtractStatus("error");
        setExtractError(data.error ?? "Extract failed");
        return;
      }
      const parsed = parseBlindPack(data);
      if (!parsed.ok) {
        setExtractStatus("error");
        setExtractError(parsed.error);
        return;
      }
      setPack(parsed.pack);
      setPackFromChat(true);
      setExtractStatus("idle");
      setPhase("review-pack");
    } catch {
      setExtractStatus("error");
      setExtractError("Network error");
    }
  };

  const discardPair = (index: number) => {
    if (!pack) return;
    const next = {
      ...pack,
      pairs: pack.pairs.filter((_, i) => i !== index),
    };
    setPack(next);
  };

  const alive = players.filter((p) => p.alive);
  const speakingOrder = alive;
  const currentSpeaker = speakingOrder[speakerIndex % Math.max(speakingOrder.length, 1)];

  const confirmEliminate = () => {
    if (!voteTarget) return;
    const target = players.find((p) => p.id === voteTarget);
    const next = eliminatePlayer(players, voteTarget);
    setPlayers(next);
    if (target) {
      setLastEliminated({ name: target.name, role: target.role });
    }
    setVoteTarget(null);
    const w = checkWinner(next);
    if (w) {
      setWinner(w);
      setPhase("end");
    } else {
      setPhase("vote-result");
    }
  };

  const againSame = () => {
    if (!pack) return;
    startDeal(pack);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {phase !== "hub" ? (
        <div className="flex justify-end px-5 pt-4 sm:px-6">
          <button
            type="button"
            onClick={killSession}
            className="min-h-10 cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint transition-colors hover:text-accent"
          >
            Kill session
          </button>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
        >
          {phase === "hub" ? (
            <BlindHero
              onPlay={() => setPhase("setup-players")}
              howOpen={howOpen}
              onToggleHow={() => setHowOpen((v) => !v)}
            />
          ) : null}

          {phase === "setup-players" ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Setup · Players
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink sm:text-5xl">
                Who&rsquo;s here
              </h2>
              <ul className="mt-8 space-y-3">
                {names.map((name, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex w-8 shrink-0 items-center font-mono text-[0.65rem] text-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <input
                      value={name}
                      onChange={(e) => {
                        const next = [...names];
                        next[i] = e.target.value;
                        setNames(next);
                      }}
                      placeholder="Name"
                      className="min-h-12 flex-1 border border-rule bg-surface px-4 text-ink outline-none placeholder:text-faint focus:border-accent"
                    />
                    {names.length > MIN_PLAYERS ? (
                      <button
                        type="button"
                        aria-label="Remove player"
                        onClick={() => setNames(names.filter((_, j) => j !== i))}
                        className="min-h-12 min-w-12 cursor-pointer border border-rule font-mono text-faint hover:border-accent hover:text-accent"
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {names.length < MAX_PLAYERS ? (
                <button
                  type="button"
                  onClick={() => setNames([...names, ""])}
                  className="mt-4 min-h-11 cursor-pointer font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted hover:text-accent"
                >
                  + Add player
                </button>
              ) : null}

              <div className="mt-10 border-t border-rule pt-8">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                  Undercovers · max {maxUc || "—"} for {playerCount || "—"}{" "}
                  players
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    disabled={undercoverCount <= 1}
                    onClick={() => setUndercoverCount((n) => Math.max(1, n - 1))}
                    className="min-h-12 min-w-12 cursor-pointer border border-rule text-ink disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="font-display text-4xl text-accent">{undercoverCount}</span>
                  <button
                    type="button"
                    disabled={undercoverCount >= maxUc}
                    onClick={() =>
                      setUndercoverCount((n) => Math.min(maxUc || 1, n + 1))
                    }
                    className="min-h-12 min-w-12 cursor-pointer border border-rule text-ink disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                {!setupValid && playerCount > 0 ? (
                  <p className="mt-4 text-sm text-muted">
                    Need {MIN_PLAYERS}–{MAX_PLAYERS} unique names and 1–
                    {maxUc || "?"} undercovers (less than half the lobby).
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                disabled={!setupValid}
                onClick={() => {
                  if (undercoverCount > maxUc) setUndercoverCount(maxUc);
                  setPhase("setup-source");
                }}
                className="mt-10 min-h-12 w-full cursor-pointer bg-accent font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink disabled:opacity-40"
              >
                Continue
              </button>
            </section>
          ) : null}

          {phase === "setup-source" ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Setup · Words
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink">
                Source
              </h2>
              <div className="mt-10 divide-y divide-rule border-y border-rule">
                <button
                  type="button"
                  onClick={useDefaultPack}
                  className="flex w-full cursor-pointer flex-col items-start gap-1 py-7 text-left transition-colors hover:bg-accent-soft/40"
                >
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
                    Default pack
                  </span>
                  <span className="font-display text-2xl text-ink">
                    {DEFAULT_PACK.pairs.length}+ built-in pairs
                  </span>
                  <span className="text-sm text-muted">No upload. Instant deal.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtractStatus("idle");
                    setExtractError(null);
                    setPhase("whatsapp");
                  }}
                  className="flex w-full cursor-pointer flex-col items-start gap-1 py-7 text-left transition-colors hover:bg-accent-soft/40"
                >
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
                    From WhatsApp
                  </span>
                  <span className="font-display text-2xl text-ink">Group chat</span>
                  <span className="text-sm text-muted">
                    Export → invent pairs. Chat is not stored.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoadError(null);
                    setPhase("load-pack");
                  }}
                  className="flex w-full cursor-pointer flex-col items-start gap-1 py-7 text-left transition-colors hover:bg-accent-soft/40"
                >
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
                    Load pack
                  </span>
                  <span className="font-display text-2xl text-ink">Saved JSON</span>
                  <span className="text-sm text-muted">
                    Reuse a pack you downloaded earlier.
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPhase("setup-players")}
                className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint hover:text-accent"
              >
                ← Players
              </button>
            </section>
          ) : null}

          {phase === "whatsapp" ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                WhatsApp
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink">
                Export
              </h2>
              <p className="mt-4 max-w-md text-sm text-muted">
                WhatsApp → Group → Export chat → <strong>Without media</strong>{" "}
                (.txt). A free model invents pairs. We do not keep the chat; the
                provider may briefly process it.
              </p>
              <label className="mt-8 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-rule bg-surface px-6 py-10 transition-colors hover:border-accent">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                  Drop .txt or tap to choose
                </span>
                <input
                  type="file"
                  accept=".txt,text/plain"
                  className="sr-only"
                  disabled={extractStatus === "extracting" || extractStatus === "parsing"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onWhatsAppFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {extractStatus === "parsing" || extractStatus === "extracting" ? (
                <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-2">
                  {extractStatus === "parsing" ? "Parsing…" : "Extracting…"}
                </p>
              ) : null}
              {extractError ? (
                <p className="mt-6 text-sm text-accent">{extractError}</p>
              ) : null}
              <button
                type="button"
                onClick={() => setPhase("setup-source")}
                className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint hover:text-accent"
              >
                ← Source
              </button>
            </section>
          ) : null}

          {phase === "load-pack" ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Load pack
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink">
                JSON
              </h2>
              <label className="mt-8 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-rule bg-surface px-6 py-10 hover:border-accent">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                  Choose blind-pack.json
                </span>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onLoadPackFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {loadError ? (
                <p className="mt-6 text-sm text-accent">{loadError}</p>
              ) : null}
              <button
                type="button"
                onClick={() => setPhase("setup-source")}
                className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint hover:text-accent"
              >
                ← Source
              </button>
            </section>
          ) : null}

          {phase === "review-pack" && pack ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Review · {pack.pairs.length} pairs
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink">
                {pack.title ?? "Pack"}
              </h2>
              <ul className="mt-8 max-h-[50vh] space-y-0 overflow-y-auto border-y border-rule">
                {pack.pairs.map((pair, i) => (
                  <li
                    key={`${pair.majority}-${i}`}
                    className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
                  >
                    <div className="min-w-0 font-mono text-sm">
                      <span className="text-ink">{pair.majority}</span>
                      <span className="mx-2 text-faint">→</span>
                      <span className="text-accent-2">{pair.undercover}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => discardPair(i)}
                      className="shrink-0 cursor-pointer font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint hover:text-accent"
                    >
                      Drop
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={pack.pairs.length < 1}
                  onClick={() => startDeal(pack)}
                  className="min-h-12 flex-1 cursor-pointer bg-accent font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink disabled:opacity-40"
                >
                  Use this pack
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadPackFile(
                      pack,
                      `${(pack.title ?? "blind-pack").replace(/\s+/g, "-").toLowerCase()}.json`,
                    )
                  }
                  className="min-h-12 flex-1 cursor-pointer border border-rule font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted hover:border-accent hover:text-accent"
                >
                  Download pack
                </button>
              </div>
              {packFromChat ? (
                <button
                  type="button"
                  onClick={() => setPhase("whatsapp")}
                  className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint hover:text-accent"
                >
                  Regenerate (re-upload)
                </button>
              ) : null}
            </section>
          ) : null}

          {phase === "deal-pass" && players[dealIndex] ? (
            <section className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 text-center sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-faint">
                Pass device
              </p>
              <h2 className="blind-wordmark mt-6 font-display text-[clamp(2.5rem,12vw,5rem)] text-ink">
                Pass to {players[dealIndex]!.name}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setWordRevealed(false);
                  setPhase("deal-reveal");
                }}
                className="mt-12 min-h-14 w-full max-w-sm cursor-pointer bg-accent px-8 font-mono text-[0.75rem] uppercase tracking-[0.22em] text-accent-ink"
              >
                I&rsquo;m {players[dealIndex]!.name}
              </button>
            </section>
          ) : null}

          {phase === "deal-reveal" && players[dealIndex] ? (
            <section className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 text-center sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-faint">
                {players[dealIndex]!.name} · look away others
              </p>
              {!wordRevealed ? (
                <button
                  type="button"
                  onClick={() => setWordRevealed(true)}
                  className="relative mt-10 min-h-24 w-full max-w-md cursor-pointer overflow-hidden bg-ink px-6 py-10"
                >
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-paper">
                    Tap to reveal word
                  </span>
                </button>
              ) : (
                <motion.p
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="blind-wordmark mt-10 font-display text-[clamp(2.5rem,10vw,4.5rem)] text-accent"
                >
                  {players[dealIndex]!.word}
                </motion.p>
              )}
              {wordRevealed ? (
                <button
                  type="button"
                  onClick={() => {
                    if (dealIndex + 1 >= players.length) {
                      setSpeakerIndex(0);
                      setPhase("hints");
                    } else {
                      setDealIndex((i) => i + 1);
                      setWordRevealed(false);
                      setPhase("deal-pass");
                    }
                  }}
                  className="mt-12 min-h-14 w-full max-w-sm animate-pulse cursor-pointer border-2 border-accent bg-accent px-8 font-mono text-[0.75rem] uppercase tracking-[0.22em] text-accent-ink motion-reduce:animate-none"
                >
                  {dealIndex + 1 >= players.length ? "Start hints" : "Hide & pass"}
                </button>
              ) : null}
            </section>
          ) : null}

          {phase === "hints" ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Hint round
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink">
                Speak
              </h2>
              <p className="mt-3 text-sm text-muted">
                One spoken hint each — host advances the marker.
              </p>
              <ul className="mt-8 divide-y divide-rule border-y border-rule">
                {players.map((p, i) => {
                  const isSpeaking =
                    p.alive && currentSpeaker && p.id === currentSpeaker.id;
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center justify-between gap-4 py-4 ${
                        !p.alive ? "opacity-40" : ""
                      } ${isSpeaking ? "bg-accent-soft/50" : ""}`}
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="font-mono text-[0.65rem] text-faint">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`font-display text-xl ${
                            p.alive ? "text-ink" : "text-muted line-through"
                          }`}
                        >
                          {p.name}
                        </span>
                      </div>
                      {isSpeaking ? (
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-accent">
                          Speaking
                        </span>
                      ) : null}
                      {!p.alive ? (
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
                          Out
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setSpeakerIndex((i) => (i + 1) % Math.max(speakingOrder.length, 1))
                  }
                  className="min-h-12 flex-1 cursor-pointer border border-rule font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted hover:border-accent hover:text-accent"
                >
                  Next speaker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoteTarget(null);
                    setPhase("vote");
                  }}
                  className="min-h-12 flex-1 cursor-pointer bg-accent font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink"
                >
                  End round → Vote
                </button>
              </div>
            </section>
          ) : null}

          {phase === "vote" ? (
            <section className="px-5 py-10 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                Vote
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-4xl text-ink">
                Eliminate
              </h2>
              <div className="mt-8 grid gap-3">
                {alive.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setVoteTarget(p.id)}
                    className={`min-h-14 cursor-pointer border px-5 text-left font-display text-2xl transition-colors ${
                      voteTarget === p.id
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-rule bg-surface text-ink hover:border-accent"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {voteTarget ? (
                <div className="mt-8 border border-accent bg-accent-soft/30 p-5">
                  <p className="font-display text-xl text-ink">
                    Eliminate{" "}
                    {players.find((p) => p.id === voteTarget)?.name}?
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={confirmEliminate}
                      className="min-h-12 flex-1 cursor-pointer bg-accent font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoteTarget(null)}
                      className="min-h-12 flex-1 cursor-pointer border border-rule font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {phase === "vote-result" && lastEliminated ? (
            <section className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16 text-center sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-faint">
                Eliminated
              </p>
              <h2 className="blind-wordmark mt-6 font-display text-[clamp(2.5rem,10vw,4.5rem)] text-accent">
                {lastEliminated.name} is out
              </h2>
              <p
                className={`mt-6 font-display text-3xl uppercase tracking-wide sm:text-4xl ${
                  lastEliminated.role === "undercover"
                    ? "text-accent-2"
                    : "text-ink"
                }`}
              >
                {lastEliminated.role === "undercover"
                  ? "Undercover"
                  : "Civilian"}
              </p>
              <p className="mt-4 text-muted">Word stays hidden until the end.</p>
              <button
                type="button"
                onClick={() => {
                  setSpeakerIndex(0);
                  setPhase("hints");
                }}
                className="mt-12 min-h-14 w-full max-w-sm cursor-pointer bg-accent font-mono text-[0.75rem] uppercase tracking-[0.22em] text-accent-ink"
              >
                Next hint round
              </button>
            </section>
          ) : null}

          {phase === "end" && winner ? (
            <section className="px-5 py-12 sm:px-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
                End
              </p>
              <h2 className="blind-wordmark mt-3 font-display text-[clamp(2.5rem,10vw,4.5rem)] text-ink">
                {winner === "civilians" ? "Civilians" : "Undercover"}
              </h2>
              <p className="mt-2 text-muted">win.</p>
              <ul className="mt-10 divide-y divide-rule border-y border-rule">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-4"
                  >
                    <span className="font-display text-xl text-ink">{p.name}</span>
                    <span className="font-mono text-sm text-muted">
                      {p.word}
                      <span className="mx-2 text-faint">·</span>
                      {p.role}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={againSame}
                  className="min-h-12 cursor-pointer bg-accent font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink"
                >
                  Again (same pack)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPack(null);
                    setPlayers([]);
                    setWinner(null);
                    setPhase("setup-players");
                  }}
                  className="min-h-12 cursor-pointer border border-rule font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted hover:border-accent hover:text-accent"
                >
                  New setup
                </button>
                {pack && packFromChat ? (
                  <button
                    type="button"
                    onClick={() => downloadPackFile(pack)}
                    className="min-h-12 cursor-pointer font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint hover:text-accent"
                  >
                    Download pack
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
