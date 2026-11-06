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

/**
 * Warna teks pilihan instruktur. Di tema terang setiap nilai mencapai kontras minimal 4,5:1 di panel (#FFFFFF),
 * dasar (#F4F7F9), well (#EDF2F5) tempat kutipan, kode inline, dan judul tabel berada, serta di atas
 * setiap stabilo palet (dan stabilo bawaan) yang diletakkan di panel maupun well.
 * Tema gelap (bawaan) tidak memakai angka ini: warnanya dibalik di app/globals.css, dan teks berstabilo memakai tinta
 * tema gelap (aturan `.prose-cyber mark`).
 * Nilainya adalah keluaran readableTextColor untuk palet awal, sehingga materi lama ikut terpetakan tepat ke sini.
 */
export const TEXT_COLOR_OPTIONS: ColorOption[] = [
  { label: "Gray", value: "#57656c" },
  { label: "Red", value: "#ba2d28" },
  { label: "Orange", value: "#a24a0a" },
  { label: "Gold", value: "#805d00" },
  { label: "Green", value: "#257144" },
  { label: "Teal", value: "#0d6f6f" },
  { label: "Cyan", value: "#006c8a" },
  { label: "Blue", value: "#2f5fa8" },
  { label: "Purple", value: "#5a3db0" },
  { label: "Pink", value: "#b0306e" },
  { label: "Brown", value: "#7a4a22" }
];

/**
 * Warna stabilo: isian terang semi-transparan. Alpha dipilih agar setiap stabilo, di atas lembar maupun
 * well, tidak lebih gelap dari luminans 0,745. Dengan begitu setiap warna teks palet, tinta bawaan, dan
 * warna link (#006C8A) tetap di atas 4,5:1 di atasnya. Diverifikasi di tests/service-smoke.test.ts.
 */
export const HIGHLIGHT_COLOR_OPTIONS: ColorOption[] = [
  { label: "Yellow", value: "rgba(250, 204, 21, 0.4)" },
  { label: "Green", value: "rgba(74, 222, 128, 0.3)" },
  { label: "Blue", value: "rgba(96, 165, 250, 0.2)" },
  { label: "Purple", value: "rgba(167, 139, 250, 0.2)" },
  { label: "Pink", value: "rgba(244, 114, 182, 0.18)" },
  { label: "Red", value: "rgba(248, 113, 113, 0.17)" },
  { label: "Orange", value: "rgba(251, 146, 60, 0.22)" },
  { label: "Gray", value: "rgba(148, 163, 184, 0.22)" }
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

// Keterbacaan warna materi di kertas terang (dipakai pelindung warna server dan normalisasi paste di browser).

/** Warna sebagai [r, g, b, a] dengan kanal 0-255 dan alpha 0-1. */
export type Rgba = [number, number, number, number];

/** Kontras minimal (WCAG AA teks normal) untuk teks materi. */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * Panel tempat materi dirender di tema terang. Palet teks dikalibrasi terhadap nilai ini (#FCFDFD); panel terang
 * sekarang #FFFFFF, sedikit lebih terang, jadi kontras palet hanya naik. Jangan diubah tanpa mengkalibrasi ulang palet.
 */
export const SHEET_RGBA: Rgba = [252, 253, 253, 1];

/**
 * Well tema terang: latar kutipan, judul tabel, dan kode inline di dalam materi, permukaan terang paling gelap di bawah
 * materi. Kalibrasi palet memakai #ECF3F5; token sekarang #EDF2F5 (selisih kontras sekitar 0,3%).
 */
export const WELL_RGBA: Rgba = [236, 243, 245, 1];

/** Stabilo bawaan untuk <mark> tanpa warna; harus sama dengan `.prose-cyber mark` di app/globals.css. */
export const DEFAULT_HIGHLIGHT_RGBA: Rgba = [250, 204, 21, 0.42];

/**
 * Palet teks tema gelap lama dan padanannya di kertas terang. Putih lama berarti "paling menonjol"
 * di latar gelap, jadi padanannya adalah tinta bawaan (warna dibuang).
 */
const LEGACY_TEXT_COLORS: Array<[string, string | null]> = [
  ["#f8fafc", null],
  ["#94a3b8", "#57656c"],
  ["#f87171", "#ba2d28"],
  ["#fb923c", "#a24a0a"],
  ["#facc15", "#805d00"],
  ["#4ade80", "#257144"],
  ["#2dd4bf", "#0d6f6f"],
  ["#38bdf8", "#006c8a"],
  ["#60a5fa", "#2f5fa8"],
  ["#a78bfa", "#5a3db0"],
  ["#f472b6", "#b0306e"],
  ["#d6a77a", "#7a4a22"]
];

/**
 * Stabilo palet sebelumnya dipetakan ke palet saat ini agar toolbar mengenali pilihannya dan agar tidak
 * dibuang karena lebih gelap dari batas stabilo: palet tema gelap (alpha 0,35 kuning / 0,3 lainnya; hijau
 * 0,3 sudah sama dengan palet saat ini) dan palet kertas terang awal (alpha 0,35).
 */
const LEGACY_HIGHLIGHT_COLORS: Array<[string, string]> = [
  ["rgba(250, 204, 21, 0.35)", "rgba(250, 204, 21, 0.4)"],
  ["rgba(74, 222, 128, 0.35)", "rgba(74, 222, 128, 0.3)"],
  ["rgba(96, 165, 250, 0.3)", "rgba(96, 165, 250, 0.2)"],
  ["rgba(96, 165, 250, 0.35)", "rgba(96, 165, 250, 0.2)"],
  ["rgba(167, 139, 250, 0.3)", "rgba(167, 139, 250, 0.2)"],
  ["rgba(167, 139, 250, 0.35)", "rgba(167, 139, 250, 0.2)"],
  ["rgba(244, 114, 182, 0.3)", "rgba(244, 114, 182, 0.18)"],
  ["rgba(244, 114, 182, 0.35)", "rgba(244, 114, 182, 0.18)"],
  ["rgba(248, 113, 113, 0.3)", "rgba(248, 113, 113, 0.17)"],
  ["rgba(248, 113, 113, 0.35)", "rgba(248, 113, 113, 0.17)"],
  ["rgba(251, 146, 60, 0.3)", "rgba(251, 146, 60, 0.22)"],
  ["rgba(251, 146, 60, 0.35)", "rgba(251, 146, 60, 0.22)"],
  ["rgba(148, 163, 184, 0.3)", "rgba(148, 163, 184, 0.22)"],
  ["rgba(148, 163, 184, 0.35)", "rgba(148, 163, 184, 0.22)"]
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Kanal rgb(): angka 0-255 atau persen. */
function parseChannel(part: string) {
  const amount = Number.parseFloat(part);
  if (!Number.isFinite(amount)) return Number.NaN;
  return clamp(part.endsWith("%") ? (amount / 100) * 255 : amount, 0, 255);
}

/** Alpha: angka 0-1 atau persen. */
function parseAlpha(part: string | undefined) {
  if (part === undefined) return 1;
  const amount = Number.parseFloat(part);
  if (!Number.isFinite(amount)) return Number.NaN;
  return clamp(part.endsWith("%") ? amount / 100 : amount, 0, 1);
}

/**
 * Membaca warna hex (#rgb, #rgba, #rrggbb, #rrggbbaa) atau rgb()/rgba() (koma atau spasi, angka atau persen).
 * Nilai lain (nama warna, inherit) menghasilkan null.
 */
export function parseCssColor(value: string | null | undefined): Rgba | null {
  const input = (value ?? "").trim().toLowerCase();
  if (!input) return null;

  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(input);
  if (hex) {
    const digits = hex[1].length <= 4 ? hex[1].split("").map((char) => char + char).join("") : hex[1];
    const channels = [0, 2, 4, 6].map((offset) => Number.parseInt(digits.slice(offset, offset + 2), 16));
    return [channels[0], channels[1], channels[2], digits.length === 8 ? channels[3] / 255 : 1];
  }

  const rgb = /^rgba?\(([^)]*)\)$/.exec(input);
  if (!rgb) return null;
  const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const color: Rgba = [parseChannel(parts[0]), parseChannel(parts[1]), parseChannel(parts[2]), parseAlpha(parts[3])];
  return color.every((part) => Number.isFinite(part)) ? color : null;
}

function linearChannel(value: number) {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** Luminans relatif WCAG (alpha diabaikan; komposit dulu bila perlu). */
export function relativeLuminance([red, green, blue]: Rgba) {
  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

/** Rasio kontras WCAG antara dua warna buram. */
export function contrastRatio(first: Rgba, second: Rgba) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Warna semi-transparan ditumpuk di atas latar buram. */
export function compositeOver([red, green, blue, alpha]: Rgba, [baseRed, baseGreen, baseBlue]: Rgba): Rgba {
  return [red * alpha + baseRed * (1 - alpha), green * alpha + baseGreen * (1 - alpha), blue * alpha + baseBlue * (1 - alpha), 1];
}

const LEGACY_TEXT_PARSED = LEGACY_TEXT_COLORS.map(([old, next]) => ({ color: parseCssColor(old) as Rgba, next }));
const LEGACY_HIGHLIGHT_PARSED = LEGACY_HIGHLIGHT_COLORS.map(([old, next]) => ({ color: parseCssColor(old) as Rgba, next }));

/** Permukaan buram tempat materi berada: lembar dan well. */
const BASE_SURFACES: Rgba[] = [SHEET_RGBA, WELL_RGBA];

/**
 * Semua latar buram yang bisa berada di bawah teks materi: lembar, well, dan setiap stabilo palet
 * (termasuk stabilo bawaan) di atas lembar maupun well. Warna teks yang lolos pelindung mencapai
 * 4,5:1 di setiap permukaan ini, sehingga kombinasi warna teks + stabilo dari toolbar selalu terbaca.
 */
const TEXT_SURFACES: Rgba[] = [
  ...BASE_SURFACES,
  ...[...HIGHLIGHT_COLOR_OPTIONS.map((option) => parseCssColor(option.value) as Rgba), DEFAULT_HIGHLIGHT_RGBA].flatMap((highlight) =>
    BASE_SURFACES.map((surface) => compositeOver(highlight, surface))
  )
];

/**
 * Luminans permukaan teks paling gelap. Teks yang lolos pelindung selalu lebih gelap dari latarnya,
 * sehingga kontrasnya hanya naik di latar yang lebih terang dari batas ini.
 */
const DARKEST_SURFACE_LUMINANCE = Math.min(...TEXT_SURFACES.map(relativeLuminance));

/** True bila warna teks mencapai 4,5:1 di setiap permukaan teks materi. */
function isReadableText(color: Rgba) {
  return TEXT_SURFACES.every((surface) => contrastRatio(compositeOver(color, surface), surface) >= MIN_TEXT_CONTRAST);
}

function sameColor(first: Rgba, second: Rgba) {
  return (
    Math.round(first[0]) === Math.round(second[0]) &&
    Math.round(first[1]) === Math.round(second[1]) &&
    Math.round(first[2]) === Math.round(second[2]) &&
    Math.abs(first[3] - second[3]) < 0.005
  );
}

function rgbToHsl([red, green, blue]: Rgba): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return [hue / 6, saturation, lightness];
}

function hslToRgba(hue: number, saturation: number, lightness: number): Rgba {
  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return [value, value, value, 1];
  }
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const channel = (offset: number) => {
    let t = hue + offset;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(channel(1 / 3) * 255), Math.round(channel(0) * 255), Math.round(channel(-1 / 3) * 255), 1];
}

function toHex([red, green, blue]: Rgba) {
  return `#${[red, green, blue].map((part) => Math.round(part).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Warna teks yang terbaca di kertas terang, di setiap permukaan materi (lembar, well, dan stabilo palet).
 * - Warna palet tema gelap lama dipetakan ke padanannya (putih lama menjadi tinta bawaan).
 * - Warna yang sudah mencapai 4,5:1 di setiap permukaan dikembalikan apa adanya (tidak diubah sama sekali).
 * - Putih/abu-abu sangat terang tanpa hue (dan warna transparan) dibuang agar teks memakai tinta bawaan.
 * - Warna lain digelapkan dengan hue dan saturasi tetap sampai mencapai 4,5:1 di setiap permukaan.
 * Mengembalikan nilai yang dipakai, atau null bila warna sebaiknya dibuang. Nilai yang tidak bisa dibaca
 * (misalnya "inherit") dikembalikan apa adanya.
 */
export function readableTextColor(value: string): string | null {
  const color = parseCssColor(value);
  if (!color) return value;

  const legacy = LEGACY_TEXT_PARSED.find((entry) => sameColor(entry.color, color));
  if (legacy) return legacy.next;
  if (color[3] < 0.05) return null;

  if (isReadableText(color)) return value;

  const effective = compositeOver(color, SHEET_RGBA);
  const [hue, saturation, lightness] = rgbToHsl(effective);
  const chroma = Math.max(effective[0], effective[1], effective[2]) - Math.min(effective[0], effective[1], effective[2]);
  if (chroma <= 24 && lightness >= 0.85) return null;

  for (let next = lightness; next > 0; next -= 0.005) {
    const candidate = hslToRgba(hue, saturation, next);
    if (isReadableText(candidate)) return toHex(candidate);
  }
  return toHex(hslToRgba(hue, saturation, 0));
}

/**
 * Latar teks (stabilo atau latar span) yang tetap membuat teks materi terbaca:
 * - palet stabilo lama dipetakan ke palet baru;
 * - latar yang di atas lembar maupun well tidak lebih gelap dari stabilo palet tergelap dikembalikan apa adanya,
 *   karena setiap warna teks yang lolos readableTextColor (dan tinta bawaan) tetap di atas 4,5:1 di atasnya;
 * - latar yang lebih gelap dibuang (null): stabilo kembali ke kuning bawaan, span kembali ke latar lembar.
 * Nilai yang tidak bisa dibaca dikembalikan apa adanya.
 */
export function readableBackgroundColor(value: string): string | null {
  const color = parseCssColor(value);
  if (!color) return value;

  const legacy = LEGACY_HIGHLIGHT_PARSED.find((entry) => sameColor(entry.color, color));
  if (legacy) return legacy.next;

  const lightEnough = BASE_SURFACES.every((surface) => relativeLuminance(compositeOver(color, surface)) >= DARKEST_SURFACE_LUMINANCE);
  return lightEnough ? value : null;
}
