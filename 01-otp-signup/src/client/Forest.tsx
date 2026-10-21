// Decorative background: three rows of pines, some mist and a few fireflies.

const ROWS = [
  { className: 'far', count: 14, height: 190, base: 520, seed: 3 },
  { className: 'mid', count: 11, height: 260, base: 580, seed: 7 },
  { className: 'near', count: 8, height: 340, base: 640, seed: 11 },
];

// Small deterministic random so the forest doesn't rearrange itself on every render.
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pine(x: number, base: number, height: number) {
  const w = height * 0.42;
  const tiers = 4;
  let d = '';
  for (let i = 0; i < tiers; i++) {
    const top = base - height + (i * height) / (tiers + 1);
    const bottom = top + height / 2.2;
    const half = (w / 2) * (0.45 + (i / tiers) * 0.55);
    d += `M${x} ${top} L${x + half} ${bottom} L${x - half} ${bottom} Z `;
  }
  d += `M${x - w * 0.05} ${base - height * 0.2} h${w * 0.1} V${base} h${-w * 0.1} Z`;
  return d;
}

export function Forest() {
  return (
    <div className="forest" aria-hidden="true">
      <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="mist" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--mist)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--mist)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {ROWS.map((row) => {
          const rand = random(row.seed);
          const step = 1300 / row.count;
          return (
            <path
              key={row.className}
              className={`trees ${row.className}`}
              d={Array.from({ length: row.count }, (_, i) =>
                pine(i * step + rand() * step * 0.6 - 50, row.base, row.height * (0.75 + rand() * 0.4)),
              ).join(' ')}
            />
          );
        })}
        <rect x="0" y="360" width="1200" height="280" fill="url(#mist)" />
      </svg>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${40 + ((i * 23) % 55)}%`,
            animationDelay: `${(i * 0.7) % 6}s`,
          }}
        />
      ))}
    </div>
  );
}
