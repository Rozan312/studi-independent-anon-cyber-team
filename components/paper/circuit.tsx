/**
 * Motif digital: jalur sirkuit (garis lurus dengan belokan 45° dan titik via) sebagai latar dekoratif.
 * Dibuat deterministik dari seed sehingga tidak berubah antar render. Selalu aria-hidden.
 */

const INK = "rgb(0 108 138)";

function hashSeed(seed: string) {
  let value = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** PRNG kecil (mulberry32) agar pola stabil untuk seed yang sama. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Trace = { d: string; end: [number, number]; start: [number, number] };
type Chip = { x: number; y: number; w: number; h: number };

const fieldCache = new Map<string, { traces: Trace[]; chips: Chip[] }>();

function buildField(seed: string) {
  const cached = fieldCache.get(seed);
  if (cached) return cached;

  const rand = random(hashSeed(seed));
  const step = 24;
  const size = 480;
  const pick = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

  const traces: Trace[] = [];
  for (let index = 0; index < 16; index += 1) {
    const fromLeft = rand() < 0.5;
    const y0 = pick(1, 19) * step;
    const x0 = fromLeft ? pick(0, 6) * step : size - pick(0, 6) * step;
    const dir = fromLeft ? 1 : -1;
    const run1 = pick(2, 6) * step;
    const jog = pick(1, 3) * step * (rand() < 0.5 ? -1 : 1);
    const run2 = pick(2, 7) * step;
    const x1 = x0 + dir * run1;
    const x2 = x1 + dir * Math.abs(jog);
    const y2 = y0 + jog;
    const x3 = x2 + dir * run2;
    traces.push({ d: `M${x0} ${y0}H${x1}L${x2} ${y2}H${x3}`, start: [x0, y0], end: [x3, y2] });
  }

  const chips: Chip[] = [];
  for (let index = 0; index < 2; index += 1) {
    chips.push({ x: pick(4, 14) * step, y: pick(3, 15) * step, w: step * 2, h: step * 1.5 });
  }

  const field = { traces, chips };
  fieldCache.set(seed, field);
  return field;
}

/** Bidang sirkuit untuk latar hero/panel. Ukuran mengikuti kotak induk (slice, tidak terdistorsi). */
export function CircuitField({ seed = "anon-cyber-team", className = "", opacity = 0.32 }: { seed?: string; className?: string; opacity?: number }) {
  const { traces, chips } = buildField(seed);

  return (
    <svg viewBox="0 0 480 480" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke={INK} strokeOpacity={opacity} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
        {traces.map((trace, index) => (
          <path key={index} d={trace.d} vectorEffect="non-scaling-stroke" />
        ))}
        {chips.map((chip, index) => (
          <g key={`chip-${index}`}>
            <rect x={chip.x} y={chip.y} width={chip.w} height={chip.h} rx={4} vectorEffect="non-scaling-stroke" />
            {[0.25, 0.5, 0.75].map((f) => (
              <path
                key={f}
                d={`M${chip.x + chip.w * f} ${chip.y}v-8M${chip.x + chip.w * f} ${chip.y + chip.h}v8`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        ))}
      </g>
      <g fill="rgb(252 253 253)" stroke={INK} strokeOpacity={opacity + 0.12} strokeWidth={1.25}>
        {traces.map((trace, index) => (
          <circle key={index} cx={trace.end[0]} cy={trace.end[1]} r={3.5} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g fill={INK} fillOpacity={opacity + 0.1}>
        {traces.map((trace, index) => (
          <rect key={index} x={trace.start[0] - 2.5} y={trace.start[1] - 2.5} width={5} height={5} rx={1} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Strip "data bus": jalur sirkuit tipis yang berulang secara horizontal (pola SVG, tidak terdistorsi).
 * Dipakai sebagai kepala kartu atau batas bawah hero.
 */
export function CircuitStrip({ className = "", opacity = 0.4 }: { className?: string; opacity?: number }) {
  return (
    <svg className={`block h-5 w-full ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="circuit-strip-tile" width="168" height="20" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={INK} strokeOpacity={opacity} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 6H38L46 14H92L100 6H168" />
            <path d="M0 15H18M62 3H80M120 15H150" />
          </g>
          <g fill="rgb(252 253 253)" stroke={INK} strokeOpacity={opacity + 0.15} strokeWidth={1}>
            <circle cx={18} cy={15} r={2.5} />
            <circle cx={62} cy={3} r={2} />
            <circle cx={150} cy={15} r={2.5} />
          </g>
          <g fill={INK} fillOpacity={opacity + 0.1}>
            <rect x={44} y={12} width={4} height={4} rx={1} />
            <rect x={98} y={4} width={4} height={4} rx={1} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit-strip-tile)" />
    </svg>
  );
}
