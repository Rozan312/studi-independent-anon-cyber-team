/**
 * Normalisasi HTML yang ditempel dari Word, Excel, Google Docs, atau halaman web (berjalan di browser).
 * Tujuannya agar yang terlihat di editor sama dengan yang lolos sanitasi server dan terbaca di tema gelap:
 * - ukuran font pt/em/rem/%/kata kunci dikonversi ke px (8-96 px);
 * - warna teks gelap (hitam bawaan Office) dan latar terang dibuang karena tidak terbaca di tema gelap;
 * - gambar yang tidak bisa disimpan (file:, data:, http:) diganti teks link agar tidak hilang diam-diam.
 */

import { isAllowedImageSrc, normalizeColor } from "@/lib/content/rich-text-config";

const KEYWORD_SIZES: Record<string, number> = {
  "xx-small": 9,
  "x-small": 10,
  small: 13,
  medium: 16,
  large: 18,
  "x-large": 24,
  "xx-large": 32
};

function toPixels(value: string): number | null {
  const input = value.trim().toLowerCase();
  if (input in KEYWORD_SIZES) return KEYWORD_SIZES[input];

  const match = /^(\d+(?:\.\d+)?)(px|pt|em|rem|%)$/.exec(input);
  if (!match) return null;

  const amount = Number.parseFloat(match[1]);
  switch (match[2]) {
    case "px":
      return amount;
    case "pt":
      return amount * (4 / 3);
    case "em":
    case "rem":
      return amount * 16;
    case "%":
      return (amount / 100) * 16;
    default:
      return null;
  }
}

let colorProbe: HTMLElement | null = null;

/** Mengubah nilai warna CSS apa pun (nama, hex, rgb) menjadi [r, g, b, a] lewat browser. */
function resolveColor(value: string): [number, number, number, number] | null {
  const canonical = normalizeColor(value);
  const direct = canonical.split(",").map(Number);
  if (direct.length >= 3 && direct.slice(0, 3).every((part) => Number.isFinite(part))) {
    return [direct[0], direct[1], direct[2], direct.length === 4 ? direct[3] : 1];
  }

  if (typeof document === "undefined") return null;

  try {
    if (!colorProbe) {
      colorProbe = document.createElement("span");
      colorProbe.style.display = "none";
      document.body.appendChild(colorProbe);
    }
    colorProbe.style.color = "";
    colorProbe.style.color = value;
    if (!colorProbe.style.color) return null;
    const computed = normalizeColor(getComputedStyle(colorProbe).color).split(",").map(Number);
    if (computed.length < 3 || computed.slice(0, 3).some((part) => !Number.isFinite(part))) return null;
    return [computed[0], computed[1], computed[2], computed.length === 4 ? computed[3] : 1];
  } catch {
    return null;
  }
}

function luminance([red, green, blue]: [number, number, number, number]) {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function normalizeElementStyle(element: HTMLElement) {
  const style = element.style;

  if (style.fontSize) {
    const pixels = toPixels(style.fontSize);
    if (pixels === null) style.removeProperty("font-size");
    else style.fontSize = `${Math.min(96, Math.max(8, Math.round(pixels)))}px`;
  }

  if (style.color) {
    const color = resolveColor(style.color);
    // Teks hitam/sangat gelap dari dokumen Office (kontras < 2,5:1 di latar tema) tidak terbaca; biarkan warna bawaan tema.
    if (!color || color[3] === 0 || luminance(color) < 0.08) style.removeProperty("color");
    else style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  for (const property of ["background-color", "background"]) {
    const value = style.getPropertyValue(property);
    if (!value) continue;
    const color = resolveColor(value);
    // Latar putih atau terang dari Office/web akan menutupi teks terang di tema gelap.
    if (!color || color[3] === 0 || luminance(color) > 0.6) style.removeProperty(property);
  }

  if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
}

export function normalizePastedHtml(html: string) {
  if (typeof DOMParser === "undefined" || !html) return html;

  const parsed = new DOMParser().parseFromString(html, "text/html");

  parsed.body.querySelectorAll<HTMLElement>("[style]").forEach(normalizeElementStyle);

  parsed.body.querySelectorAll("img").forEach((image) => {
    const src = image.getAttribute("src") ?? "";
    if (isAllowedImageSrc(src)) return;

    const alt = image.getAttribute("alt")?.trim() || "gambar";
    const replacement = parsed.createElement(/^https?:\/\//i.test(src) ? "a" : "span");
    if (replacement.tagName === "A") replacement.setAttribute("href", src);
    replacement.textContent = /^https?:\/\//i.test(src)
      ? `Gambar: ${alt}`
      : `[Gambar "${alt}" tidak ikut tertempel. Unggah lewat tombol gambar.]`;
    image.replaceWith(replacement);
  });

  return parsed.body.innerHTML;
}

/**
 * True bila clipboard hanya berisi gambar (screenshot atau gambar yang disalin), bukan dokumen.
 * Office menaruh bitmap pratinjau di samping HTML; dalam kasus itu HTML-nya yang harus ditempel.
 */
export function isPureImagePaste(data: DataTransfer | null) {
  if (!data) return false;
  const html = data.getData("text/html") ?? "";
  const text = data.getData("text/plain") ?? "";

  if (html.trim()) {
    if (typeof DOMParser === "undefined") return false;
    const body = new DOMParser().parseFromString(html, "text/html").body;
    // Hanya gambar: tidak ada teks, ada minimal satu <img>, dan tidak ada struktur dokumen seperti tabel atau daftar.
    return (
      (body.textContent ?? "").trim() === "" &&
      body.querySelector("img") !== null &&
      body.querySelector("table, ul, ol, p:not(:empty), h1, h2, h3, h4, h5, h6, pre, blockquote") === null
    );
  }

  return !text.trim();
}
