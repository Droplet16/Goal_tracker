export const TOTAL_DAYS = 60;
export const HOURS_PER_DAY = 2;
export const STORAGE_KEY = "sticker-goal-board-v1";

export type Mode = "peel" | "restore";

export interface Phase {
  id: "green" | "yellow" | "rose";
  name: string;
  from: number;
  to: number;
  chip: string;
  colors: string[];
}

export const PHASES: Phase[] = [
  {
    id: "green",
    name: "Разгон",
    from: 1,
    to: 20,
    chip: "#b8e356",
    colors: ["#cdf37b", "#9ccc3a", "#e9ffb0"],
  },
  {
    id: "yellow",
    name: "Разгар",
    from: 21,
    to: 40,
    chip: "#ffdf59",
    colors: ["#ffef8f", "#ffc93a", "#fff6c0"],
  },
  {
    id: "rose",
    name: "Финишная прямая",
    from: 41,
    to: 60,
    chip: "#ffa9c3",
    colors: ["#ffc9da", "#ff8fb2", "#ffdde8"],
  },
];

export const phaseOf = (day: number): Phase =>
  PHASES.find((p) => day >= p.from && day <= p.to) ?? PHASES[2];

export interface BoardState {
  removed: number[];
  goal: string;
  startDate: string; // ISO yyyy-mm-dd — день, когда доска повешена на стену
}

export function defaultState(): BoardState {
  return {
    removed: [],
    goal: "",
    startDate: new Date().toISOString().slice(0, 10),
  };
}

export function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw) as Partial<BoardState>;
    return {
      removed: Array.isArray(p.removed)
        ? [...new Set(p.removed.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_DAYS))]
        : [],
      goal: typeof p.goal === "string" ? p.goal : "",
      startDate:
        typeof p.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.startDate)
          ? p.startDate
          : new Date().toISOString().slice(0, 10),
    };
  } catch {
    return defaultState();
  }
}

export function saveState(s: BoardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}

/** Детерминированный «случайный» 0..1, чтобы стикеры всегда лежали одинаково */
export function seeded(id: number, salt: number): number {
  const x = Math.sin(id * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function addDays(iso: string, days: number): Date {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtDate(d: Date): string {
  return d
    .toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    .replace(".", "")
    .trim();
}

export const dayLabel = (startDate: string, day: number) =>
  fmtDate(addDays(startDate, day - 1));
