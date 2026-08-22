import { useEffect, useMemo, useRef, useState } from "react";
import Sticker from "./components/Sticker";
import {
  Toasts,
  ResetModal,
  WinOverlay,
  PushPin,
  type ToastData,
} from "./components/Overlays";
import { burst, confettiRain } from "./fx";
import {
  TOTAL_DAYS,
  HOURS_PER_DAY,
  PHASES,
  phaseOf,
  loadState,
  saveState,
  addDays,
  fmtDate,
  dayLabel,
  type BoardState,
  type Mode,
} from "./lib";

const CORK_URL =
  "https://image.qwenlm.ai/generated-images/22af01f0-d512-4fd9-a4e2-9566089e04ac/_result.png";

const ICONS = {
  peel: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8z" fill="currentColor" stroke="none" />
    </svg>
  ),
  undo: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  ),
  reset: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4v6h6" />
      <path d="M3.5 13a8.5 8.5 0 1 0 2-6.5L3 10" />
    </svg>
  ),
  pencil: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 20 1-4L17 4l3 3L8 19l-4 1z" />
      <path d="m14 7 3 3" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 12 5 5L20 6" />
    </svg>
  ),
};

export default function App() {
  const [board, setBoard] = useState<BoardState>(() => loadState());
  const [mode, setMode] = useState<Mode>("peel");
  const [peeling, setPeeling] = useState<ReadonlySet<number>>(new Set());
  const [restoring, setRestoring] = useState<ReadonlySet<number>>(new Set());
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const trackRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<number | null>(null);
  if (countRef.current === null) countRef.current = board.removed.length;

  useEffect(() => saveState(board), [board]);

  const removedSet = useMemo(() => new Set(board.removed), [board.removed]);
  const done = board.removed.length;
  const pct = Math.round((done / TOTAL_DAYS) * 100);
  const hours = done * HOURS_PER_DAY;
  const left = TOTAL_DAYS - done;

  const nextDay = useMemo(() => {
    for (let d = 1; d <= TOTAL_DAYS; d++) if (!removedSet.has(d)) return d;
    return TOTAL_DAYS + 1;
  }, [removedSet]);
  const currentPhase = phaseOf(Math.min(nextDay, TOTAL_DAYS));

  const startLabel = fmtDate(addDays(board.startDate, 0));
  const finishLabel = fmtDate(addDays(board.startDate, TOTAL_DAYS - 1));

  const dust = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: `${(i * 37 + 11) % 100}%`,
        top: `${(i * 53 + 17) % 90}%`,
        size: 3 + ((i * 7) % 4),
        dur: `${13 + ((i * 5) % 10)}s`,
        delay: `-${(i * 3.7) % 14}s`,
      })),
    []
  );

  const pushToast = (text: string, tone = "#b8e356") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };

  const celebrateTrack = () => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(
      r.left + r.width / 2,
      r.top + r.height / 2,
      ["#b8e356", "#ffdf59", "#ffa9c3", "#fdf8ec"],
      42,
      1.3
    );
  };

  const peel = (day: number) => {
    if (removedSet.has(day) || peeling.has(day)) return;
    const el = document.getElementById(`stk-${day}`);
    if (el) {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, phaseOf(day).colors, 18, 1);
    }
    setPeeling((p) => new Set(p).add(day));
    const newCount = (countRef.current ?? 0) + 1;
    countRef.current = newCount;

    window.setTimeout(() => {
      setPeeling((p) => {
        const n = new Set(p);
        n.delete(day);
        return n;
      });
      setBoard((b) => ({ ...b, removed: [...b.removed, day] }));
      if (newCount === 20) {
        pushToast("Фаза «Разгон» позади — 40 часов в копилке!", PHASES[0].chip);
        celebrateTrack();
      } else if (newCount === 40) {
        pushToast("«Разгар» позади — 80 часов! Осталось 20 дней.", PHASES[1].chip);
        celebrateTrack();
      } else if (newCount === TOTAL_DAYS) {
        window.setTimeout(() => {
          setWinOpen(true);
          confettiRain(150);
        }, 380);
      }
    }, 520);
  };

  const restore = (day: number) => {
    if (!removedSet.has(day) || restoring.has(day)) return;
    setRestoring((s) => new Set(s).add(day));
    countRef.current = Math.max(0, (countRef.current ?? 1) - 1);
    setBoard((b) => ({ ...b, removed: b.removed.filter((x) => x !== day) }));
    window.setTimeout(
      () =>
        setRestoring((s) => {
          const n = new Set(s);
          n.delete(day);
          return n;
        }),
      520
    );
  };

  const peelNext = () => {
    if (nextDay > TOTAL_DAYS) {
      pushToast("Все 60 стикеров уже сорваны!", "#ffa9c3");
      return;
    }
    const el = document.getElementById(`stk-${nextDay}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => peel(nextDay), el ? 420 : 0);
  };

  const resetBoard = () => {
    setBoard((b) => ({ ...b, removed: [] }));
    countRef.current = 0;
    setResetOpen(false);
    setWinOpen(false);
    pushToast("Доска обновлена: 60 стикеров снова на месте", "#ffdf59");
  };

  const saveGoal = () => {
    setBoard((b) => ({ ...b, goal: draft.trim() }));
    setEditing(false);
  };

  useEffect(() => {
    if (!winOpen) return;
    const iv = window.setInterval(() => confettiRain(60), 1200);
    return () => window.clearInterval(iv);
  }, [winOpen]);

  const segWidth = (from: number, to: number) =>
    `${(Math.min(Math.max(done - (from - 1), 0), to - from + 1) / TOTAL_DAYS) * 100}%`;

  const Segments = ({ mini = false }: { mini?: boolean }) => (
    <>
      {PHASES.map((p) => (
        <div
          key={p.id}
          className={mini ? "mini-seg" : "seg"}
          style={{ width: segWidth(p.from, p.to), background: p.chip }}
        />
      ))}
    </>
  );

  return (
    <div className="min-h-screen font-body text-ink">
      {/* ── стена: обои + зерно + свет ─────────────────────────── */}
      <div className="wall-bg" style={{ backgroundImage: `url(${CORK_URL})` }} />
      <div className="wall-noise" aria-hidden="true" />
      <div className="wall-shade" aria-hidden="true" />
      <div className="wall-vignette" aria-hidden="true" />
      {dust.map((d, i) => (
        <span
          key={i}
          className="dust"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDuration: d.dur,
            animationDelay: d.delay,
          }}
          aria-hidden="true"
        />
      ))}
      <div className="frame-wood" aria-hidden="true" />

      {/* ── тонкий прогресс на самой кромке ─────────────────────── */}
      <div className="mini-track" aria-hidden="true">
        <Segments mini />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:px-10 md:pt-14">
        {/* ── лист с целью и прогрессом ─────────────────────────── */}
        <section
          className="paper relative px-5 py-6 sm:px-8 md:px-10 md:py-8"
          style={{ transform: "rotate(-0.5deg)" }}
        >
          <PushPin className="absolute -top-6 left-1/2 -translate-x-1/2" />
          <span className="corner-tape -top-3 left-6 -rotate-6 hidden sm:block" aria-hidden="true" />
          <span className="corner-tape -top-3 right-6 rotate-6 hidden sm:block" aria-hidden="true" />

          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
            <div className="min-w-[240px] flex-1">
              <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-ink-soft">
                Доска цели · 60 дней
              </p>

              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={saveGoal}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveGoal();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  maxLength={60}
                  placeholder="Например: выучить испанский до B1"
                  className="goal-input mt-1 w-full font-marker text-3xl font-bold leading-tight text-ink md:text-4xl"
                />
              ) : (
                <h1 className="group mt-1 flex cursor-text items-start gap-2" onClick={() => { setDraft(board.goal); setEditing(true); }}>
                  <span
                    className={`font-marker text-3xl font-bold leading-tight md:text-[2.6rem] ${
                      board.goal ? "text-ink" : "text-ink-soft/60"
                    }`}
                  >
                    {board.goal || "Назови свою цель — кликни сюда"}
                  </span>
                  <span className="mt-3 shrink-0 text-ink-soft/60 transition group-hover:text-ink">
                    {ICONS.pencil}
                  </span>
                </h1>
              )}

              <p className="mt-2 text-xs font-semibold text-ink-soft sm:text-sm">
                Старт: {startLabel} · Финиш: {finishLabel} · по {HOURS_PER_DAY} часа в день
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div key={pct} className="pct-pop font-display text-5xl font-black leading-none md:text-6xl">
                {pct}
                <span className="text-2xl md:text-3xl">%</span>
              </div>
              <p className="mt-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">
                {done} из 60 дней · {hours} ч вложено
              </p>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">
                осталось {left} {left === 1 ? "день" : left < 5 && left > 0 ? "дня" : "дней"}
              </p>
            </div>
          </div>

          {/* ── прогресс-бар ──────────────────────────────────── */}
          <div className="mt-6 flex items-center gap-3">
            <div className="track relative flex-1" ref={trackRef}>
              <div className="track-fill">
                <Segments />
              </div>
              <span className="tick" style={{ left: "33.333%" }} aria-hidden="true" />
              <span className="tick" style={{ left: "66.666%" }} aria-hidden="true" />
              <span
                className="flag"
                style={{ left: `${pct}%`, background: currentPhase.chip }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ── фазы ──────────────────────────────────────────── */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PHASES.map((p) => {
              const phaseDone = board.removed.filter((d) => d >= p.from && d <= p.to).length;
              const total = p.to - p.from + 1;
              const complete = phaseDone === total;
              return (
                <span key={p.id} className={`phase-chip ${complete ? "chip-done" : ""}`}>
                  <span className="chip-dot" style={{ background: p.chip }} />
                  <span className="font-extrabold">{p.name}</span>
                  <span className="opacity-70">
                    {complete ? ICONS.check : `${phaseDone}/${total}`}
                  </span>
                </span>
              );
            })}
            <span className="phase-chip">
              <span className="chip-dot" style={{ background: currentPhase.chip }} />
              <span className="opacity-70">сейчас:</span>
              <span className="font-extrabold">
                {done === TOTAL_DAYS ? "финиш!" : `день ${nextDay}`}
              </span>
            </span>
          </div>

          {/* ── пульт ─────────────────────────────────────────── */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="seg-ctl" role="group" aria-label="Режим доски">
              <button
                type="button"
                className={`seg-btn ${mode === "peel" ? "active" : ""}`}
                onClick={() => setMode("peel")}
              >
                {ICONS.peel} Срывать
              </button>
              <button
                type="button"
                className={`seg-btn ${mode === "restore" ? "active" : ""}`}
                onClick={() => setMode("restore")}
              >
                {ICONS.undo} Вернуть
              </button>
            </div>
            <button type="button" className="btn btn-lime" onClick={peelNext}>
              {ICONS.peel}
              Сорвать следующий день
            </button>
            <button type="button" className="btn btn-ghosty" onClick={() => setResetOpen(true)}>
              {ICONS.reset}
              Сбросить доску
            </button>
            <p className="ml-auto hidden font-marker text-xl leading-none text-ink-soft md:block">
              клик по стикеру = день засчитан
            </p>
          </div>
        </section>

        {/* ── записки на стене ──────────────────────────────────── */}
        <div className="mt-7 hidden justify-end gap-6 lg:flex">
          <div className="note-card" style={{ transform: "rotate(-4deg)" }}>
            <span className="tape tape-a" style={{ background: "rgba(184,227,86,.55)" }} aria-hidden="true" />
            <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.28em] text-ink-soft">
              Правило
            </p>
            <p className="mt-1 font-marker text-2xl font-semibold leading-none">
              2 часа в день — и точка.
            </p>
          </div>
          <div className="note-card" style={{ transform: "rotate(3deg)" }}>
            <span className="tape tape-a" style={{ background: "rgba(255,169,195,.55)" }} aria-hidden="true" />
            <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.28em] text-ink-soft">
              Механика
            </p>
            <p className="mt-1 font-marker text-2xl font-semibold leading-none">
              Сорвал стикер — день засчитан.
            </p>
          </div>
        </div>

        {/* ── сама доска со стикерами ───────────────────────────── */}
        <section
          aria-label="Доска со стикерами на 60 дней"
          className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-5 md:mt-10 md:grid-cols-6 md:gap-4 lg:grid-cols-8 xl:grid-cols-10"
        >
          {Array.from({ length: TOTAL_DAYS }, (_, i) => {
            const day = i + 1;
            return (
              <Sticker
                key={day}
                day={day}
                removed={removedSet.has(day)}
                peeling={peeling.has(day)}
                restoring={restoring.has(day)}
                mode={mode}
                startDate={board.startDate}
                onPeel={peel}
                onRestore={restore}
              />
            );
          })}
        </section>

        <footer className="mt-12 text-center">
          <p className="font-marker text-2xl font-semibold text-[#f3e5c3]">
            60 стикеров · {TOTAL_DAYS * HOURS_PER_DAY} часов · одна цель
          </p>
          <p className="mt-1 text-xs font-semibold text-[#f3e5c3]/70">
            Прогресс сохраняется в этом браузере автоматически. Сегодня по плану — день{" "}
            {Math.min(nextDay, TOTAL_DAYS)} ({dayLabel(board.startDate, Math.min(nextDay, TOTAL_DAYS))}).
          </p>
        </footer>
      </main>

      <Toasts items={toasts} />
      <ResetModal open={resetOpen} onCancel={() => setResetOpen(false)} onConfirm={resetBoard} />
      <WinOverlay
        open={winOpen}
        goal={board.goal}
        hours={TOTAL_DAYS * HOURS_PER_DAY}
        days={TOTAL_DAYS}
        onRestart={resetBoard}
        onClose={() => setWinOpen(false)}
      />
    </div>
  );
}
