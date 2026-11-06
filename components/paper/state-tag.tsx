/**
 * Label status sebaris yang langsung terbaca: "Opens 24 Oct", "Closed", "Draft", "Solved", "Locked".
 * Datar dan tegak; warna mengikuti arti statusnya (amber terjadwal, merah ditutup/error, hijau benar,
 * violet selesai, netral untuk draft/terkunci). Latar berwarna tipis dengan tepi 35% dari warna yang sama,
 * sama seperti StatusPill, agar tetap terbaca di panel gelap maupun terang.
 */

export type StateTone = "violet" | "green" | "red" | "amber" | "cyan" | "ink" | "muted";

const toneClass: Record<StateTone, string> = {
  violet: "border-violet/35 bg-violet-soft text-violet",
  green: "border-green/35 bg-green-soft text-green",
  red: "border-red/35 bg-red-soft text-red",
  amber: "border-amber/35 bg-amber-soft text-amber",
  cyan: "border-cyan-ink/35 bg-cyan-soft text-cyan-ink",
  // Netral memakai sambungan tegas: tepi line biasa hilang di atas well pada tema gelap.
  ink: "border-line-strong bg-well text-ink",
  muted: "border-line-strong bg-well text-ink-2"
};

const ICONS = {
  check: <path d="m3.5 8.5 3 3 6-7" />,
  lock: <path d="M4.5 7.5h7v6h-7Zm1.5 0V5.5a2 2 0 0 1 4 0v2" />
} as const;

export function StateTag({
  tone = "muted",
  icon,
  children,
  className = ""
}: {
  tone?: StateTone;
  icon?: keyof typeof ICONS;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 font-display text-xs font-semibold leading-4 ${toneClass[tone]} ${className}`}
    >
      {icon ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICONS[icon]}
        </svg>
      ) : null}
      {children}
    </span>
  );
}
