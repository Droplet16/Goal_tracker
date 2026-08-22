export interface ToastData {
  id: number;
  text: string;
  tone: string;
}

export function Toasts({ items }: { items: ToastData[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] flex w-full max-w-xl -translate-x-1/2 flex-col items-center gap-2 px-4 pointer-events-none">
      {items.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-dot" style={{ background: t.tone }} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

export function PushPin({
  className = "",
  color = "#e0483e",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg className={className} width="26" height="34" viewBox="0 0 26 34" aria-hidden="true">
      <ellipse cx="13" cy="31" rx="6.5" ry="2.2" fill="rgba(20,8,0,.3)" />
      <rect x="12" y="18" width="2" height="12" rx="1" fill="#8f887e" />
      <circle cx="13" cy="10" r="9" fill={color} />
      <circle cx="9.5" cy="6.5" r="3" fill="rgba(255,255,255,.5)" />
      <circle cx="13" cy="10" r="9" fill="none" stroke="rgba(30,10,0,.3)" strokeWidth="1" />
    </svg>
  );
}

export function ResetModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onCancel}>
      <div
        className="paper card-pop relative w-full max-w-md px-7 py-8 text-center"
        style={{ transform: "rotate(-1deg)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <PushPin className="absolute -top-6 left-1/2 -translate-x-1/2" />
        <h3 className="font-display text-lg font-bold text-ink md:text-xl">
          Сбросить доску?
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink-soft">
          Все 60 стикеров вернутся на стену, а счётчик часов обнулится.
          Название цели и дата старта останутся.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="btn btn-ghosty" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Да, сбросить
          </button>
        </div>
      </div>
    </div>
  );
}

export function WinOverlay({
  open,
  goal,
  hours,
  days,
  onRestart,
  onClose,
}: {
  open: boolean;
  goal: string;
  hours: number;
  days: number;
  onRestart: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div
        className="paper card-pop relative w-full max-w-lg px-8 py-10 text-center"
        style={{ transform: "rotate(1deg)" }}
        role="dialog"
        aria-modal="true"
      >
        <span className="corner-tape left-8 -top-3 -rotate-6" aria-hidden="true" />
        <span className="corner-tape right-8 -top-3 rotate-3" aria-hidden="true" />
        <p className="font-marker text-4xl font-bold leading-none text-ink md:text-5xl">
          все 60 — сорваны!
        </p>
        <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-ink md:text-3xl">
          Цель достигнута
        </h2>
        {goal && (
          <p className="mt-2 font-marker text-2xl leading-snug text-ink-soft">«{goal}»</p>
        )}
        <p className="mt-4 text-sm font-semibold text-ink-soft">
          {hours} часов работы · {days} дней дисциплины · результат — навсегда
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-lime" onClick={onRestart}>
            Начать новую доску
          </button>
          <button type="button" className="btn btn-ghosty" onClick={onClose}>
            Остаться любоваться
          </button>
        </div>
      </div>
    </div>
  );
}
