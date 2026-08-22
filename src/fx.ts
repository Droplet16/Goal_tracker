/** Лёгкие эффекты на Web Animations API: бумажные крошки и конфетти. */

export function burst(
  x: number,
  y: number,
  colors: string[],
  count = 16,
  power = 1
) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const w = 5 + Math.random() * 7;
    const h = w * (0.6 + Math.random() * 0.9);
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${
      colors[i % colors.length]
    };z-index:80;pointer-events:none;border-radius:2px;`;
    document.body.appendChild(el);

    const a = Math.random() * Math.PI * 2;
    const d = (50 + Math.random() * 90) * power;
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d - 55 * power;
    const rot = Math.random() * 720 - 360;

    el.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${
            dy + 150 * power
          }px)) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 650 + Math.random() * 550,
        easing: "cubic-bezier(.15,.65,.35,1)",
      }
    ).onfinish = () => el.remove();
  }
}

export function confettiRain(count = 100) {
  const colors = [
    "#b8e356",
    "#ffdf59",
    "#ffa9c3",
    "#cdf37b",
    "#ffc93a",
    "#ffc9da",
    "#fdf8ec",
  ];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const w = 6 + Math.random() * 7;
    const h = 8 + Math.random() * 10;
    const x = Math.random() * vw;
    el.style.cssText = `position:fixed;left:${x}px;top:-24px;width:${w}px;height:${h}px;background:${
      colors[i % colors.length]
    };z-index:80;pointer-events:none;border-radius:2px;opacity:0;`;
    document.body.appendChild(el);

    const sway = Math.random() * 180 - 90;
    const rot = Math.random() * 1080 - 540;
    el.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
        { opacity: 1, offset: 0.07 },
        {
          transform: `translate(${sway}px, ${vh + 80}px) rotate(${rot}deg)`,
          opacity: 0.9,
        },
      ],
      {
        duration: 1600 + Math.random() * 1500,
        delay: Math.random() * 450,
        easing: "cubic-bezier(.25,.4,.45,1)",
      }
    ).onfinish = () => el.remove();
  }
}
