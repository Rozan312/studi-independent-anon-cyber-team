import { rosetteInk } from "@/components/paper/rosette";

/**
 * Pita guilloche: beberapa gelombang sinus yang saling bergeser fase, seperti bingkai uang kertas atau
 * kepala halaman visa. Selalu dekoratif (aria-hidden); warnanya mengikuti tinta seed (biasanya slug path).
 */

const bandCache = new Map<string, string[]>();

function hash(seed: string) {
  let value = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

function bandPaths(seed: string) {
  const cached = bandCache.get(seed);
  if (cached) return cached;

  const value = hash(seed);
  const waves = 3 + (value % 3);
  const lines = 7;
  const paths: string[] = [];
  for (let line = 0; line < lines; line += 1) {
    const phase = (line / lines) * Math.PI * 2;
    let d = "";
    for (let x = 0; x <= 600; x += 4) {
      const t = (x / 600) * Math.PI * 2 * waves;
      const y = 12 + 7.5 * Math.sin(t + phase) + 2.5 * Math.sin(t * 3 - phase);
      d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }

  bandCache.set(seed, paths);
  return paths;
}

export function GuillocheBand({
  seed,
  className = "",
  opacity = 0.55
}: {
  seed: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 600 24"
      preserveAspectRatio="none"
      className={`block h-6 w-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke={rosetteInk(seed)} strokeOpacity={opacity} strokeWidth={0.75}>
        {bandPaths(seed).map((d, index) => (
          <path key={index} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
