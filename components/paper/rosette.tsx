/**
 * Rosette guilloche: emblem unik tiap learning path (deterministik dari slug), sekaligus cincin progres.
 * Bagian yang sudah selesai digambar dengan tinta penuh, sisanya dengan tinta pucat: seni dan status
 * adalah gambar yang sama.
 */

const ROSETTE_INKS = ["#0088B4", "#5A3DB0", "#267345", "#B23A48", "#8F5708", "#2F5FA8", "#0F7C7C"] as const;

type Detail = "lo" | "md" | "hi";

/** Jumlah titik sampel per gelombang (luar, dalam, inti): emblem kecil tidak butuh kurva sehalus emblem besar. */
const SAMPLES: Record<Detail, [number, number, number]> = {
  lo: [96, 80, 64],
  md: [180, 150, 120],
  hi: [300, 240, 180]
};

type RosetteSpec = {
  id: string;
  ink: string;
  outer: string;
  inner: string;
  core: string;
  outerCopies: number;
  innerCopies: number;
  coreCopies: number;
  outerStep: number;
  innerStep: number;
  coreStep: number;
};

const specCache = new Map<string, RosetteSpec>();

function hashSeed(seed: string) {
  // FNV-1a 32-bit: cukup acak dan stabil untuk parameter visual.
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pick(hash: number, shift: number, min: number, max: number) {
  return min + ((((hash >>> shift) ^ (hash >>> (shift + 7))) >>> 0) % (max - min + 1));
}

function wavePath(radius: number, amplitude: number, lobes: number, samples: number) {
  let path = "";
  for (let index = 0; index <= samples; index += 1) {
    const angle = (Math.PI * 2 * index) / samples;
    const r = radius + amplitude * Math.sin(lobes * angle);
    const x = (r * Math.cos(angle)).toFixed(1);
    const y = (r * Math.sin(angle)).toFixed(1);
    path += `${index === 0 ? "M" : "L"}${x} ${y}`;
  }
  return `${path}Z`;
}

function detailFor(size: number): Detail {
  if (size <= 64) return "lo";
  if (size <= 140) return "md";
  return "hi";
}

export function rosetteSpec(seed: string, detail: Detail = "hi"): RosetteSpec {
  const key = `${seed}|${detail}`;
  const cached = specCache.get(key);
  if (cached) return cached;

  const hash = hashSeed(seed || "anon-cyber-team");
  const outerLobes = pick(hash, 0, 11, 17);
  const innerLobes = pick(hash, 5, 7, 12);
  const coreLobes = pick(hash, 11, 5, 9);
  const outerCopies = pick(hash, 3, 5, 7);
  const innerCopies = pick(hash, 9, 4, 6);
  const coreCopies = pick(hash, 14, 3, 5);

  const [outerSamples, innerSamples, coreSamples] = SAMPLES[detail];

  const spec: RosetteSpec = {
    id: `rosette-${hash.toString(36)}-${detail}`,
    ink: ROSETTE_INKS[hash % ROSETTE_INKS.length],
    outer: wavePath(80, 6.5 + (hash % 3), outerLobes, outerSamples),
    inner: wavePath(61, 5 + ((hash >>> 4) % 3), innerLobes, innerSamples),
    core: wavePath(41, 3.5 + ((hash >>> 8) % 2), coreLobes, coreSamples),
    outerCopies,
    innerCopies,
    coreCopies,
    outerStep: 360 / outerLobes / outerCopies,
    innerStep: 360 / innerLobes / innerCopies,
    coreStep: 360 / coreLobes / coreCopies
  };

  specCache.set(key, spec);
  return spec;
}

/** Warna tinta emblem sebuah path, untuk dipakai elemen lain yang perlu senada. */
export function rosetteInk(seed: string) {
  return rosetteSpec(seed, "lo").ink;
}

function piePath(fraction: number) {
  const radius = 100;
  const angle = Math.PI * 2 * fraction - Math.PI / 2;
  const large = fraction > 0.5 ? 1 : 0;
  return `M0 0L0 ${-radius}A${radius} ${radius} 0 ${large} 1 ${(radius * Math.cos(angle)).toFixed(2)} ${(radius * Math.sin(angle)).toFixed(2)}Z`;
}

/**
 * Tiap gelombang didefinisikan sekali di <defs> lalu diulang dengan <use> yang diputar, agar HTML tetap kecil.
 * Emblem dengan seed dan tingkat detail yang sama menghasilkan definisi identik, jadi id yang sama aman.
 */
function Strokes({ spec, withCore, small }: { spec: RosetteSpec; withCore: boolean; small: boolean }) {
  // Emblem kecil memakai lebih sedikit salinan agar anyaman tetap terbaca, bukan menjadi gumpalan.
  const outer = small ? Math.min(spec.outerCopies, 3) : spec.outerCopies;
  const inner = small ? Math.min(spec.innerCopies, 3) : spec.innerCopies;
  const core = small ? Math.min(spec.coreCopies, 2) : spec.coreCopies;
  return (
    <>
      {Array.from({ length: outer }, (_, index) => (
        <use key={`o${index}`} href={`#${spec.id}-o`} transform={`rotate(${(index * spec.outerStep).toFixed(2)})`} />
      ))}
      {Array.from({ length: inner }, (_, index) => (
        <use key={`i${index}`} href={`#${spec.id}-i`} transform={`rotate(${(index * spec.innerStep).toFixed(2)})`} />
      ))}
      {withCore
        ? Array.from({ length: core }, (_, index) => (
            <use key={`c${index}`} href={`#${spec.id}-c`} transform={`rotate(${(index * spec.coreStep).toFixed(2)})`} />
          ))
        : null}
    </>
  );
}

export function PathRosette({
  seed,
  size = 48,
  progress,
  label,
  sublabel,
  title,
  animate = false,
  className = ""
}: {
  /** Biasanya slug learning path. */
  seed: string;
  size?: number;
  /** 0..1. Bila diisi, rosette menjadi cincin progres. */
  progress?: number | null;
  /** Teks di tengah (misalnya "3/5"). Inti rosette dikosongkan bila ada label. */
  label?: string;
  sublabel?: string;
  /** Nama yang dibacakan pembaca layar; tanpa title, emblem dianggap dekoratif. */
  title?: string;
  animate?: boolean;
  className?: string;
}) {
  const spec = rosetteSpec(seed, detailFor(size));
  const hasProgress = typeof progress === "number" && Number.isFinite(progress);
  const fraction = hasProgress ? Math.min(1, Math.max(0, progress as number)) : 1;
  const clipId = `rosette-${hashSeed(seed).toString(36)}-${Math.round(fraction * 1000)}`;
  // Lebar garis dalam piksel layar (non-scaling-stroke), jadi tetap terbaca di ukuran berapa pun.
  const strokeWidth = size <= 64 ? 0.8 : size <= 140 ? 0.85 : 0.9;
  const small = size <= 64;
  const withCore = !label;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      className={`shrink-0 ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <path id={`${spec.id}-o`} d={spec.outer} vectorEffect="non-scaling-stroke" />
        <path id={`${spec.id}-i`} d={spec.inner} vectorEffect="non-scaling-stroke" />
        {withCore ? <path id={`${spec.id}-c`} d={spec.core} vectorEffect="non-scaling-stroke" /> : null}
        {hasProgress && fraction > 0 && fraction < 1 ? (
          <clipPath id={clipId}>
            <path d={piePath(fraction)} />
          </clipPath>
        ) : null}
      </defs>
      <g fill="none" className={animate ? "rosette-in" : undefined}>
        {/* Cetakan dasar: guilloche path dalam tinta pucat yang tetap terbaca, juga saat progres masih 0. */}
        {hasProgress ? (
          <g stroke={spec.ink} strokeOpacity={0.45} strokeWidth={strokeWidth}>
            <Strokes spec={spec} withCore={withCore} small={small} />
          </g>
        ) : null}
        {/* Bagian yang selesai dicetak ulang dengan tinta penuh dan garis lebih tebal. */}
        {fraction > 0 ? (
          <g
            stroke={spec.ink}
            strokeOpacity={hasProgress ? 1 : 0.9}
            strokeWidth={hasProgress ? strokeWidth * 1.6 : strokeWidth}
            clipPath={hasProgress && fraction < 1 ? `url(#${clipId})` : undefined}
          >
            <Strokes spec={spec} withCore={withCore} small={small} />
          </g>
        ) : null}
      </g>
      {label ? (
        <>
          <text
            x="0"
            y={sublabel ? 2 : 11}
            textAnchor="middle"
            fill="rgb(16 22 31)"
            style={{ font: "700 32px var(--font-archivo), sans-serif", fontVariantNumeric: "tabular-nums" }}
          >
            {label}
          </text>
          {sublabel ? (
            <text
              x="0"
              y="30"
              textAnchor="middle"
              fill="rgb(92 106 114)"
              style={{ font: "600 15px var(--font-archivo), sans-serif", letterSpacing: "0.12em", fontStretch: "75%" }}
            >
              {sublabel.toUpperCase()}
            </text>
          ) : null}
        </>
      ) : null}
    </svg>
  );
}
