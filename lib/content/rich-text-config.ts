/**
 * Konfigurasi bersama editor materi (client) dan sanitizer HTML (server).
 * Semua nilai di sini aman dipakai di browser; jangan impor modul server di file ini.
 */

/** Batas ukuran HTML materi yang disimpan (karakter). */
export const MAX_RICH_CONTENT_LENGTH = 200_000;

export type FontOption = { label: string; value: string };

/** Font web-safe yang tersedia di Windows, macOS, dan sebagian besar Linux. Nilai kosong = font bawaan tema. */
export const FONT_FAMILY_OPTIONS: FontOption[] = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "\"Trebuchet MS\", Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "\"Times New Roman\", Times, serif" },
  { label: "Courier New", value: "\"Courier New\", Courier, monospace" }
];

/** Ukuran font yang ditawarkan toolbar. Nilai kosong = ukuran bawaan paragraf. */
export const FONT_SIZE_OPTIONS: FontOption[] = [
  { label: "Default", value: "" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "40", value: "40px" },
  { label: "48", value: "48px" }
];

export type ColorOption = { label: string; value: string };

/** Warna teks yang tetap terbaca di latar gelap tema. */
export const TEXT_COLOR_OPTIONS: ColorOption[] = [
  { label: "Putih", value: "#f8fafc" },
  { label: "Abu-abu", value: "#94a3b8" },
  { label: "Merah", value: "#f87171" },
  { label: "Oranye", value: "#fb923c" },
  { label: "Kuning", value: "#facc15" },
  { label: "Hijau", value: "#4ade80" },
  { label: "Toska", value: "#2dd4bf" },
  { label: "Biru muda", value: "#38bdf8" },
  { label: "Biru", value: "#60a5fa" },
  { label: "Ungu", value: "#a78bfa" },
  { label: "Merah muda", value: "#f472b6" },
  { label: "Cokelat", value: "#d6a77a" }
];

/** Warna stabilo semi-transparan agar teks di atasnya tetap terbaca. */
export const HIGHLIGHT_COLOR_OPTIONS: ColorOption[] = [
  { label: "Kuning", value: "rgba(250, 204, 21, 0.35)" },
  { label: "Hijau", value: "rgba(74, 222, 128, 0.3)" },
  { label: "Biru", value: "rgba(96, 165, 250, 0.3)" },
  { label: "Ungu", value: "rgba(167, 139, 250, 0.3)" },
  { label: "Merah muda", value: "rgba(244, 114, 182, 0.3)" },
  { label: "Merah", value: "rgba(248, 113, 113, 0.3)" },
  { label: "Oranye", value: "rgba(251, 146, 60, 0.3)" },
  { label: "Abu-abu", value: "rgba(148, 163, 184, 0.3)" }
];

/** Perbandingan nilai CSS yang tahan terhadap normalisasi browser (spasi, tanda kutip, huruf besar). */
export function normalizeCssValue(value: string | null | undefined) {
  return (value ?? "").replace(/["']/g, "").replace(/\s+/g, " ").replace(/\s*,\s*/g, ",").trim().toLowerCase();
}

/**
 * Bentuk kanonik warna untuk perbandingan: hex (#rgb, #rrggbb) dan rgb()/rgba() menjadi "r,g,b[,a]".
 * Browser menyimpan warna inline sebagai rgb(), sedangkan palet memakai hex.
 */
export function normalizeColor(value: string | null | undefined) {
  const input = (value ?? "").trim().toLowerCase();
  if (!input) return "";

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(input);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split("").map((char) => char + char).join("") : hex[1];
    return [0, 2, 4].map((offset) => Number.parseInt(digits.slice(offset, offset + 2), 16)).join(",");
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(input);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length === 4 && Number.parseFloat(parts[3]) === 1) parts.pop();
    return parts.join(",");
  }

  return input;
}

/** URL gambar yang diizinkan di materi: media internal hasil upload atau https. */
export function isAllowedImageSrc(src: string | null | undefined) {
  if (!src) return false;
  return /^\/api\/media\/[0-9a-fA-F-]{36}$/.test(src) || /^https:\/\/[^\s"'<>]+$/i.test(src);
}

/**
 * Normalisasi URL yang diketik pengguna untuk link. Mengembalikan null bila skema tidak diizinkan.
 * Diizinkan: http(s), mailto, path relatif "/..." dan anchor "#...".
 */
export function normalizeLinkHref(input: string) {
  const value = input.trim();
  if (!value) return null;
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  if (/^[^\s/]+\.[^\s]+$/.test(value)) return `https://${value}`;
  return null;
}
