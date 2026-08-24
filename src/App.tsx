import { useEffect, useMemo, useRef, useState } from "react";
import Sticker from "./components/Sticker";
import { PushPin, ResetModal, Toasts, WinOverlay, type ToastData } from "./components/Overlays";
import { burst, confettiRain } from "./fx";
import {
  HOURS_PER_DAY,
  PHASES,
  TOTAL_DAYS,
  addDays,
  defaultState,
  fmtDate,
  loadState,
  phaseOf,
  saveState,
  seeded,
  type BoardState,
  type Mode,
} from "./lib";

const CORK_URL =
  "https://image.qwenlm.ai/generated-images/22af01f0-d512-4fd9-a4e2-9566089e04ac/_result.png";

const WALLPAPER_URL =
  "https://image.qwenlm.ai/generated-images/b61530f2-a0b1-4fd5-96c8-57037b42b8eb/_result.png";

const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const ALL_DAYS = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

const PEEL_MSGS = [
  "Так держать!",
  "Минус один день!",
  "Ещё +2 часа в копилку",
  "Дисциплина решает",
  "Цель ближе!",
  "Не останавливайся!",
];

export default function App() {
  const [state, setState] = useState<BoardState>(loadState);
  const [peelingIds, setPeelingIds] = useState<number[]>([]);
  const [restoringIds, setRestoringIds] = useState<number[]>([]);
  const [mode, setMode] = useState<Mode>("peel");
  const [resetOpen, setResetOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);
  const removedSet = useMemo(() => new Set(state.removed), [state.removed]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const done = state.removed.length;
  const hours = done * HOURS_PER_DAY;
  const pct = (done / TOTAL_DAYS) * 100;
  const remaining = TOTAL_DAYS - done;
  const finishDate = addDays(state.startDate, TOTAL_DAYS);

  const pushToast = (text: string, tone: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };

  const peel = (day: number, viaButton = false) => {
    if (removedSet.has(day) || peelingIds.includes(day)) return;
    setPeelingIds((ids) => [...ids, day]);

    const el = document.getElementById(`stk-${day}`);
    if (el) {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, phaseOf(day).colors);
    }

    window.setTimeout(() => {
      setPeelingIds((ids) => ids.filter((i) => i !== day));
      setState((s) => {
        const removed = [...s.removed, day];
        const total = removed.length;
        const phase = phaseOf(day);
        const phaseDone = ALL_DAYS.filter(
          (d) => d >= phase.from && d <= phase.to && removed.includes(d)
        ).length;

        if (total === TOTAL_DAYS) {
          confettiRain(170);
          pushToast("Все 60 дней! Цель достигнута!", "#ffdf59");
          window.setTimeout(() => setWinOpen(true), 800);
        } else if (phaseDone === phase.to - phase.from + 1) {
          confettiRain(70);
          pushToast(`«${phase.name}» завершена — ${total} из 60!`, phase.chip);
        } else if (total === 1) {
          pushToast("Первый шаг сделан!", phase.chip);
        } else if (!viaButton && seeded(day, 9) > 0.55) {
          pushToast(PEEL_MSGS[total % PEEL_MSGS.length], phase.chip);
        }
        return { ...s, removed };
      });
    }, 420);
  };

  const restore = (day: number) => {
    if (!removedSet.has(day)) return;
    setState((s) => ({ ...s, removed: s.removed.filter((d) => d !== day) }));
    setRestoringIds((ids) => [...ids, day]);
    window.setTimeout(() => setRestoringIds((ids) => ids.filter((i) => i !== day)), 450);
    pushToast(`День ${day} вернулся на доску`, "#cdbfa0");
  };

  const nextDay = useMemo(
    () => ALL_DAYS.find((d) => !removedSet.has(d)),
    [removedSet]
  );

  const peelNext = () => {
    if (nextDay) peel(nextDay, true);
  };

  const resetBoard = () => {
    setWinOpen(false);
    setResetOpen(false);
    setState((s) => ({ ...defaultState(), goal: s.goal, startDate: s.startDate }));
    pushToast("Доска обновлена — все 60 стикеров на месте", "#b8e356");
  };

  const dust = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${Math.round(seeded(i, 7) * 100)}%`,
        top: `${Math.round(12 + seeded(i, 8) * 80)}%`,
        size: 2 + Math.round(seeded(i, 11) * 3),
        dur: `${(16 + seeded(i, 12) * 18).toFixed(1)}s`,
        del: `${(-seeded(i, 13) * 20).toFixed(1)}s`,
      })),
    []
  );

  const segFill = (from: number, to: number) => {
    const width = ((to - from + 1) / TOTAL_DAYS) * 100;
    const left = ((from - 1) / TOTAL_DAYS) * 100;
    const filled = Math.max(0, Math.min(to, done) - from + 1);
    const w = (filled / (to - from + 1)) * 100;
    return { left: `${left}%`, width: `${width}%`, fill: `${w}%` };
  };

  return (
    <div className="min-h-screen">
      {/* Светлые обои + зерно + мягкая виньетка */}
      <div className="wall-bg" style={{ backgroundImage: `url(${WALLPAPER_URL})` }} />
      <div className="wall-noise" style={{ backgroundImage: NOISE_URI }} aria-hidden="true" />
      <div className="wall-shade" aria-hidden="true" />
      {dust.map((d, i) => (
        <span
          key={i}
          className="dust"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            ["--dur" as string]: d.dur,
            ["--del" as string]: d.del,
          }}
        />
      ))}

      {/* ── Прогресс ── */}
      <header className="topbar">
        <div className="mx-auto max-w-6xl px-4">
          <div className="topbar-card relative overflow-hidden rounded-xl px-4 py-3 md:px-6 md:py-4">
            <div
              className="absolute left-0 top-0 h-1 transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #b8e356, #ffdf59 50%, #ffa9c3)",
              }}
            />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="min-w-[190px] flex-1">
                <p className="font-marker text-2xl leading-none text-ink md:text-3xl">
                  Дорога к цели
                </p>
                <div className="bar-wrap">
                  <div className="bar">
                    {PHASES.map((p) => {
                      const s = segFill(p.from, p.to);
                      return (
                        <div
                          key={p.id}
                          className="bar-seg"
                          style={{ left: s.left, width: s.width }}
                        >
                          <div
                            className="bar-seg-fill h-full transition-all duration-700"
                            style={{ width: s.fill, background: p.chip }}
                          />
                        </div>
                      );
                    })}
                    <div className="bar-fill" style={{ width: `${pct}%` }}>
                      {done > 0 && done < TOTAL_DAYS && <div className="bar-stripes" />}
                    </div>
                  </div>
                  <div className="bar-flag" style={{ left: `calc(${pct}% )` }}>
                    <div style={{ transform: "translateX(-50%)" }}>
                      <svg width="30" height="34" viewBox="0 0 30 34">
                        <g transform={`rotate(${pct > 50 ? 8 : -8} 15 17)`}>
                          <rect
                            x="4"
                            y="2"
                            width="22"
                            height="26"
                            rx="3"
                            transform="rotate(-6 15 15)"
                            fill={done >= TOTAL_DAYS ? "#ffdf59" : phaseOf(Math.max(1, Math.min(60, done + 1))).chip}
                            stroke="rgba(70,50,10,.25)"
                          />
                          <text
                            x="15"
                            y="21"
                            textAnchor="middle"
                            fontFamily="Caveat, cursive"
                            fontWeight="700"
                            fontSize="17"
                            fill="#3d3115"
                          >
                            {Math.round(pct)}%
                          </text>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-extrabold tracking-wider text-ink-soft">
                  <span>СТАРТ</span>
                  <span>20 ДНЕЙ</span>
                  <span>40 ДНЕЙ</span>
                  <span>ФИНИШ</span>
                </div>
              </div>

              <div className="flex items-center gap-5 md:gap-7">
                <div>
                  <p className="font-display text-3xl leading-none text-ink md:text-4xl">
                    {Math.round(pct)}%
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-ink-soft">
                    {done} из {TOTAL_DAYS} дней
                  </p>
                </div>
                <div className="hidden h-10 w-px bg-[#d8cfba] sm:block" />
                <div className="hidden sm:block">
                  <p className="font-display text-2xl leading-none text-ink md:text-3xl">
                    {hours} ч
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-ink-soft">вложено в цель</p>
                </div>
                <div className="hidden h-10 w-px bg-[#d8cfba] md:block" />
                <div className="hidden md:block">
                  <p className="font-display text-2xl leading-none text-ink md:text-3xl">
                    {remaining}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-ink-soft">дней осталось</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {PHASES.map((p) => {
                  const complete = done >= p.to;
                  return (
                    <span
                      key={p.id}
                      className={`mode-pill ${complete ? "on" : ""}`}
                      title={`${p.name}: дни ${p.from}–${p.to}`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-[3px]"
                        style={{ background: p.chip, transform: "rotate(45deg)" }}
                      />
                      {p.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Доска ── */}
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-40 md:pt-44">
        <section className="relative">
          <div className="frame">
            <span className="frame-corner -left-1.5 -top-1.5" aria-hidden="true" />
            <span className="frame-corner -right-1.5 -top-1.5" aria-hidden="true" />
            <span className="frame-corner -bottom-1.5 -left-1.5" aria-hidden="true" />
            <span className="frame-corner -bottom-1.5 -right-1.5" aria-hidden="true" />

            <div
              className="board-cork"
              style={{ backgroundImage: `url(${CORK_URL}), ${NOISE_URI}` }}
            >
              <div className="relative">
                {/* Лист с целью */}
                <div className="relative z-10 mx-auto mb-8 max-w-2xl md:mb-10">
                  <div
                    className="paper relative rounded-[4px] px-6 py-5 text-center md:px-10 md:py-6"
                    style={{ transform: "rotate(-1.4deg)" }}
                  >
                    <PushPin className="absolute -top-5 left-1/2 -translate-x-1/2" />
                    <span className="corner-tape -left-6 -top-2 -rotate-[24deg]" aria-hidden="true" />
                    <span className="corner-tape -right-6 -top-2 rotate-[24deg]" aria-hidden="true" />

                    <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
                      Моя цель на 60 дней
                    </p>
                    {editingGoal ? (
                      <input
                        autoFocus
                        className="goal-input mt-1 text-center"
                        defaultValue={state.goal}
                        maxLength={48}
                        placeholder="впиши свою цель…"
                        onBlur={(e) => {
                          setState((s) => ({ ...s, goal: e.target.value.trim() }));
                          setEditingGoal(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") setEditingGoal(false);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingGoal(true)}
                        className="goal-input mt-1 text-center transition-opacity hover:opacity-70"
                        title="Нажми, чтобы изменить цель"
                      >
                        {state.goal || "впиши свою цель…"}
                      </button>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11.5px] font-bold text-ink-soft">
                      <span>старт: {fmtDate(addDays(state.startDate, 0))}</span>
                      <span>финиш: {fmtDate(finishDate)}</span>
                      <span className="rounded-full bg-[#ffe9a0] px-2.5 py-0.5 text-[#6b5300]">
                        {HOURS_PER_DAY} часа в день
                      </span>
                    </div>
                  </div>
                </div>

                {/* Сетка стикеров */}
                <div className="board-grid">
                  {ALL_DAYS.map((d) => (
                    <Sticker
                      key={d}
                      day={d}
                      removed={removedSet.has(d)}
                      peeling={peelingIds.includes(d)}
                      restoring={restoringIds.includes(d)}
                      mode={mode}
                      startDate={state.startDate}
                      onPeel={peel}
                      onRestore={restore}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="frame-shelf mx-3" aria-hidden="true" />

          {/* Записки на стене */}
          <div className="note hidden -left-52 top-24 rotate-[-7deg] xl:block">
            правило простое: <b>2 часа в день</b> — сорвал стикер, день засчитан
          </div>
          <div className="note hidden -right-52 top-40 rotate-[5deg] xl:block">
            не пропусти <b>два дня подряд</b> — цепочка сильнее мотивации
          </div>
        </section>

        {/* Панель действий */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="btn btn-lime flex items-center gap-2 text-[15px]"
              onClick={peelNext}
              disabled={!nextDay}
              style={{ opacity: nextDay ? 1 : 0.5, cursor: nextDay ? "pointer" : "default" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 12.5 5.2 3.8c.3-.8 1.4-.8 1.7 0l1.2 3 3-1.1c.8-.3 1.5.6 1 1.3l-3.4 4.7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Сорвать день {nextDay ?? "— все сорваны"}
            </button>
            <button
              type="button"
              className={`mode-pill ${mode === "restore" ? "on" : ""} !px-4 !py-2`}
              onClick={() => setMode((m) => (m === "peel" ? "restore" : "peel"))}
              title="В этом режиме клик по контуру возвращает стикер на место"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M12 7A5 5 0 1 1 7 2m0 0 2.2-1M7 2l2.2 1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Режим возврата
            </button>
            <button type="button" className="btn btn-ghosty" onClick={() => setResetOpen(true)}>
              Сбросить доску
            </button>
          </div>
          <p className="max-w-lg text-center text-xs font-semibold leading-relaxed text-ink-soft">
            Срывай стикер, когда день отработан. Прогресс хранится прямо в браузере —
            доска дождётся тебя даже после перезагрузки.
          </p>
        </div>
      </main>

      <Toasts items={toasts} />
      <ResetModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={resetBoard}
      />
      <WinOverlay
        open={winOpen}
        goal={state.goal}
        hours={hours}
        days={TOTAL_DAYS}
        onRestart={resetBoard}
        onClose={() => setWinOpen(false)}
      />
    </div>
  );
}
