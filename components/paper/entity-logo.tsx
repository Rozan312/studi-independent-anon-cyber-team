/**
 * Logo room atau learning path. Bila instruktur mengunggah logo (Room.logoUrl / LearningPath.logoUrl),
 * gambar itu yang dipakai; bila belum, atau URL-nya gagal dimuat, ditampilkan inisial nama dalam kotak
 * berwarna yang tetap sama untuk nama yang sama. Selalu dekoratif: nama lengkap ditulis di sebelahnya.
 */

import { FallbackImage } from "@/components/paper/fallback-image";

const STOPWORDS = new Set(["a", "an", "and", "the", "to", "of", "for", "in", "on", "with", "dan", "di", "ke", "untuk", "yang"]);

// Palet identitas (token tile-*), terpisah dari warna status (violet/hijau/merah/amber) agar kotak inisial tidak
// terbaca sebagai status. Cyan logo sengaja tidak dipakai: cyan hanya untuk aksi utama, item aktif, tautan, dan progres.
const TINTS = ["bg-tile-indigo text-tile-indigo-ink", "bg-tile-teal text-tile-teal-ink", "bg-well text-ink-2"] as const;

// Radius 6 sampai 10 px, sama dengan panel; lg dipakai baris katalog (56 px).
const SIZES = {
  sm: "h-9 w-9 rounded-md text-xs",
  md: "h-11 w-11 rounded-lg text-sm",
  lg: "h-14 w-14 rounded-sheet text-base",
  xl: "h-24 w-24 rounded-sheet text-2xl"
} as const;

/**
 * "Introduction to HTTP" -> "IH", "Linux Fundamentals" -> "LF", "Networking" -> "NE".
 * Untuk nama orang, stopword tidak dibuang ("Dan Pratama" -> "DP", bukan "PR").
 */
export function initialsFor(name: string, { person = false }: { person?: boolean } = {}) {
  const words = name
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .filter((word) => person || !STOPWORDS.has(word.toLowerCase()));
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
  person = false,
  className = ""
}: {
  name: string;
  /** Nama orang (avatar): inisial dari kata pertama dan kedua tanpa membuang stopword. */
  person?: boolean;
  /** URL logo yang diunggah; kosong berarti pakai inisial nama. */
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  // Sambungan 1 px line-strong: kotak tetap terlihat saat baris di bawahnya berubah ke bg-well ketika disorot.
  const initialsTile = (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center border border-line-strong font-display font-bold tracking-[0.02em] ${SIZES[size]} ${tintFor(name)} ${className}`}
    >
      {initialsFor(name, { person })}
    </span>
  );

  return src ? (
    <FallbackImage
      src={src}
      alt=""
      aria-hidden="true"
      className={`shrink-0 border border-line-strong bg-well object-cover ${SIZES[size]} ${className}`}
      fallback={initialsTile}
    />
  ) : (
    initialsTile
  );
}
