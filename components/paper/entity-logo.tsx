/**
 * Logo room atau learning path. Bila instruktur mengunggah logo (Room.logoUrl / LearningPath.logoUrl),
 * gambar itu yang dipakai; bila belum, ditampilkan inisial nama dalam kotak berwarna yang tetap sama
 * untuk nama yang sama. Selalu dekoratif: nama lengkap ditulis di sebelahnya.
 */

const STOPWORDS = new Set(["a", "an", "and", "the", "to", "of", "for", "in", "on", "with", "dan", "di", "ke", "untuk", "yang"]);

// Palet identitas, terpisah dari warna status (violet/hijau/merah/amber) agar kotak inisial tidak terbaca sebagai status.
const TINTS = [
  "bg-cyan-soft text-cyan-ink border-cyan-ink/20",
  "bg-tile-indigo text-tile-indigo-ink border-tile-indigo-ink/20",
  "bg-tile-teal text-tile-teal-ink border-tile-teal-ink/20",
  "bg-well text-ink-2 border-line"
] as const;

const SIZES = {
  sm: "h-9 w-9 rounded-md text-xs",
  md: "h-11 w-11 rounded-lg text-sm",
  lg: "h-16 w-16 rounded-xl text-lg",
  xl: "h-24 w-24 rounded-2xl text-2xl"
} as const;

/** "Introduction to HTTP" -> "IH", "Linux Fundamentals" -> "LF", "Networking" -> "NE". */
export function initialsFor(name: string) {
  const words = name
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .filter((word) => !STOPWORDS.has(word.toLowerCase()));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function tintFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash * 31 + name.charCodeAt(index)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

export function EntityLogo({
  name,
  src,
  size = "md",
  className = ""
}: {
  name: string;
  /** URL logo yang diunggah; kosong berarti pakai inisial nama. */
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" aria-hidden="true" className={`shrink-0 border border-line bg-sheet object-cover ${SIZES[size]} ${className}`} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center border font-bold tracking-[0.02em] ${SIZES[size]} ${tintFor(name)} ${className}`}
    >
      {initialsFor(name)}
    </span>
  );
}
