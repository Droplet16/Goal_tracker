import { useEffect, useRef, useState, type CSSProperties } from "react";
import { dayLabel, phaseOf, seeded, HOURS_PER_DAY, type Mode } from "../lib";

interface Props {
  day: number;
  removed: boolean;
  peeling: boolean;
  restoring: boolean;
  mode: Mode;
  startDate: string;
  onPeel: (day: number) => void;
  onRestore: (day: number) => void;
}

export default function Sticker({
  day,
  removed,
  peeling,
  restoring,
  mode,
  startDate,
  onPeel,
  onRestore,
}: Props) {
  const [floatKey, setFloatKey] = useState(0);
  const [floatVisible, setFloatVisible] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const wasPeeling = useRef(false);

  useEffect(() => {
    if (peeling && !wasPeeling.current) setFloatKey((k) => k + 1);
    wasPeeling.current = peeling;
  }, [peeling]);

  useEffect(() => {
    if (floatKey === 0) return;
    setFloatVisible(true);
    const t = window.setTimeout(() => setFloatVisible(false), 950);
    return () => window.clearTimeout(t);
  }, [floatKey]);

  const rot = `${(seeded(day, 1) * 8 - 4).toFixed(2)}deg`;
  const tapeRot = `${(seeded(day, 2) * 12 - 6).toFixed(1)}deg`;
  const doubleTape = seeded(day, 3) > 0.74;
  const phase = phaseOf(day);

  // След от сорванного стикера: карандашный контур на стене
  if (removed && !restoring) {
    const clickable = mode === "restore";
    return (
      <button
        type="button"
        id={`stk-${day}`}
        className={`ghost ${clickable ? "clickable" : ""}`}
        style={{ "--rot": rot } as CSSProperties}
        aria-label={clickable ? `Вернуть стикер дня ${day}` : `День ${day} засчитан`}
        tabIndex={clickable ? 0 : -1}
        onClick={() => {
          if (clickable) onRestore(day);
        }}
      >
        <span className="ghost-num">{day}</span>
        {clickable && <span className="ghost-hint">вернуть</span>}
      </button>
    );
  }

  const style = {
    "--rot": rot,
    "--tape-rot": tapeRot,
    animationDelay: `${day * 22}ms`,
  } as CSSProperties;

  return (
    <button
      type="button"
      id={`stk-${day}`}
      className={[
        "sticker",
        `phase-${phase.id}`,
        restoring ? "restoring" : "enter",
        peeling ? "peeling" : "",
        wiggle ? "wiggle" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-label={`Сорвать стикер дня ${day}`}
      title={`День ${day} · ${dayLabel(startDate, day)}`}
      onClick={() => {
        if (mode === "peel") {
          onPeel(day);
        } else {
          setWiggle(true);
          window.setTimeout(() => setWiggle(false), 340);
        }
      }}
    >
      <span className="tape tape-a" aria-hidden="true" />
      {doubleTape && <span className="tape tape-b" aria-hidden="true" />}
      <span className="num">{day}</span>
      <span className="date hidden sm:block">{dayLabel(startDate, day)}</span>
      {floatKey > 0 && peeling && (
        <span key={floatKey} className="hours-float">
          +{HOURS_PER_DAY} ч
        </span>
      )}
    </button>
  );
}
