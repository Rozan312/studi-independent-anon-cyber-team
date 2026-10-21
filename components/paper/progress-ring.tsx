/**
 * Cincin progres tersegmen: satu segmen per room. Segmen selesai berwarna violet, room berikutnya cyan
 * (langkah berikutnya), sisanya abu muda. Lebih dari 24 room digambar sebagai satu busur kontinu.
 */

export type RingSegment = "done" | "next" | "todo";

// Warna lewat token CSS agar ikut berganti di night mode.
const COLORS: Record<RingSegment, string> = {
  done: "rgb(var(--violet))",
  next: "rgb(var(--cyan))",
  todo: "rgb(var(--line-soft))"
};

const R = 80;

function point(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [radius * Math.cos(rad), radius * Math.sin(rad)] as const;
}

function arc(start: number, end: number, radius = R) {
  const [x1, y1] = point(start, radius);
  const [x2, y2] = point(end, radius);
  const large = end - start > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function ProgressRing({
  segments,
  size = 200,
  label,
  sublabel,
  title,
  className = ""
}: {
  /** Status tiap room dalam urutan path. */
  segments: RingSegment[];
  size?: number;
  label?: string;
  sublabel?: string;
  /** Nama untuk pembaca layar; tanpa title, cincin dianggap dekoratif. */
  title?: string;
  className?: string;
}) {
  const total = segments.length;
  const continuous = total === 0 || total > 24;
  const gap = total > 1 ? Math.min(6, 120 / total) : 0;
  const span = total > 0 ? 360 / total : 360;
  const doneShare = total > 0 ? segments.filter((segment) => segment === "done").length / total : 0;

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
      {/* Cincin luar bertitik dan cincin dalam tipis: kesan gauge digital. */}
      <circle r={94} fill="none" style={{ stroke: "rgb(var(--cyan-ink) / 0.35)" }} strokeWidth={1.4} strokeDasharray="1.5 5" strokeLinecap="round" />
      <circle r={66} fill="none" style={{ stroke: "rgb(var(--line))" }} strokeWidth={1} />

      <g className="ring-in" fill="none" strokeWidth={12} strokeLinecap="butt">
        {continuous ? (
          <>
            <circle r={R} style={{ stroke: COLORS.todo }} />
            {doneShare > 0 ? (
              doneShare >= 1 ? <circle r={R} style={{ stroke: COLORS.done }} /> : <path d={arc(0, 360 * doneShare)} style={{ stroke: COLORS.done }} />
            ) : null}
          </>
        ) : total === 1 ? (
          // Satu room: busur 360° tidak bisa digambar sebagai path (titik awal = titik akhir), jadi pakai lingkaran.
          <circle r={R} style={{ stroke: COLORS[segments[0]] }} />
        ) : (
          segments.map((segment, index) => (
            <path key={index} d={arc(index * span + gap / 2, (index + 1) * span - gap / 2)} style={{ stroke: COLORS[segment] }} />
          ))
        )}
      </g>

      {/* Tanda batas antar segmen di cincin dalam. */}
      {!continuous && total > 1 ? (
        <g style={{ stroke: "rgb(var(--line-strong))" }} strokeWidth={1.2} strokeLinecap="round">
          {segments.map((_, index) => {
            const [x1, y1] = point(index * span, 62);
            const [x2, y2] = point(index * span, 70);
            return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      ) : null}

      {label ? (
        <text
          x="0"
          y={sublabel ? 4 : 11}
          textAnchor="middle"
          style={{ fill: "rgb(var(--ink))", font: "700 34px var(--font-archivo), sans-serif", fontVariantNumeric: "tabular-nums" }}
        >
          {label}
        </text>
      ) : null}
      {sublabel ? (
        <text
          x="0"
          y="30"
          textAnchor="middle"
          style={{ fill: "rgb(var(--ink-3))", font: "600 14px var(--font-archivo), sans-serif", letterSpacing: "0.12em", fontStretch: "75%" }}
        >
          {sublabel.toUpperCase()}
        </text>
      ) : null}
    </svg>
  );
}
