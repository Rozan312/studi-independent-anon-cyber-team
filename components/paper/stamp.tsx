/**
 * Stempel tinta karet. Dipakai untuk penyelesaian (room, quiz, path) dan status yang tidak boleh hilang
 * (terjadwal, ditutup, draft). Rotasi deterministik dari teksnya agar tidak berubah tiap render.
 */

export type StampTone = "violet" | "green" | "red" | "amber" | "cyan" | "ink" | "muted";

const toneClass: Record<StampTone, string> = {
  violet: "text-violet",
  green: "text-green",
  red: "text-red",
  amber: "text-amber",
  cyan: "text-cyan-ink",
  ink: "text-ink",
  muted: "text-ink-3"
};

function rotationFor(text: string, range = 7) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) | 0;
  const span = range * 2 + 1;
  const value = (((hash % span) + span) % span) - range;
  // Hindari stempel yang terlalu lurus; stempel tangan jarang tegak sempurna.
  return value === 0 ? -2 : value;
}

export function Stamp({
  tone = "violet",
  shape = "rect",
  top,
  title,
  bottom,
  strike = false,
  size = "md",
  className = ""
}: {
  tone?: StampTone;
  shape?: "rect" | "round";
  /** "sm" untuk stempel di dalam form atau baris daftar. */
  size?: "md" | "sm";
  /** Baris kecil di atas, misalnya "Passed". */
  top?: string;
  /** Isi utama stempel, misalnya judul room atau skor. */
  title: string;
  /** Baris kecil di bawah, misalnya tanggal. */
  bottom?: string;
  /** Mainkan animasi hentakan (hanya untuk penyelesaian yang baru terjadi). */
  strike?: boolean;
  className?: string;
}) {
  const rotate = rotationFor(`${top ?? ""}${title}${bottom ?? ""}`);
  const round = shape === "round";
  const small = size === "sm";
  const frameClass = round
    ? small
      ? "h-[4.75rem] w-[4.75rem] rounded-full p-1.5"
      : "h-[6.5rem] w-[6.5rem] rounded-full p-2"
    : small
      ? "min-h-[4.25rem] w-[8rem] rounded-[8px] px-2 py-1.5"
      : "min-h-[5.75rem] w-[9.75rem] rounded-[10px] px-2.5 py-2";
  // Judul tidak pernah dipotong dengan elipsis: judul panjang turun ke baris berikutnya dan stempel ikut meninggi.
  const titleClass = round ? (small ? "text-sm" : "text-lg") : small ? "break-words text-xs [text-wrap:balance]" : "break-words text-[0.95rem] [text-wrap:balance]";

  return (
    <span
      className={`stamp inline-flex shrink-0 select-none ${toneClass[tone]} ${strike ? "stamp-strike" : ""} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ["--stamp-rotate" as string]: `${rotate}deg` }}
    >
      <span
        className={`flex flex-col items-center justify-center border-current text-center uppercase leading-tight ${small ? "border-2" : "border-[2.5px]"} ${frameClass}`}
        style={{ fontStretch: "74%" }}
      >
        <span
          className={`flex h-full w-full flex-col items-center justify-center gap-0.5 border border-current ${round ? "rounded-full" : "rounded-[6px]"} px-1.5 py-1`}
        >
          {top ? <span className={`${small ? "text-[0.5625rem]" : "text-[0.625rem]"} font-bold tracking-[0.16em]`}>{top}</span> : null}
          <span className={`font-extrabold tracking-[0.03em] ${titleClass}`}>{title}</span>
          {bottom ? (
            <span
              className={`${small ? "text-[0.5625rem]" : "text-[0.625rem]"} whitespace-nowrap font-semibold tracking-[0.1em]`}
            >
              {bottom}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  );
}

/** Stempel status kecil sebaris, misalnya "Opens 24 Oct" atau "Closed". Tanpa efek aus agar teks kecilnya tetap kontras. */
export function StateStamp({
  tone = "amber",
  children,
  className = ""
}: {
  tone?: StampTone;
  children: React.ReactNode;
  className?: string;
}) {
  const rotate = rotationFor(typeof children === "string" ? children : "state", 3);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[5px] border-[1.5px] border-current px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.1em] ${toneClass[tone]} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, fontStretch: "74%" }}
    >
      {children}
    </span>
  );
}

/** Slot kosong di paspor belajar: tempat stempel berikutnya. */
export function StampSlot({ label, title, size = "md" }: { label: string; title: string; size?: "md" | "sm" }) {
  const small = size === "sm";
  return (
    <span
      className={`inline-flex shrink-0 flex-col items-center justify-center border-2 border-dashed border-line-strong text-center uppercase leading-tight text-ink-3 ${
        small ? "min-h-[4.25rem] w-[8rem] rounded-[8px] px-2 py-1.5" : "min-h-[5.75rem] w-[9.75rem] rounded-[10px] px-2.5 py-2"
      }`}
      style={{ fontStretch: "74%" }}
    >
      <span className={`${small ? "text-[0.5625rem]" : "text-[0.625rem]"} font-bold tracking-[0.16em]`}>{label}</span>
      <span className={`break-words font-extrabold tracking-[0.03em] [text-wrap:balance] ${small ? "text-xs" : "text-[0.95rem]"}`}>{title}</span>
    </span>
  );
}
