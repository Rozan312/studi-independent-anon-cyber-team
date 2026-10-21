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

// ---------------------------------------------------------------------------
// Daftar dari Microsoft Word: paragraf `mso-list` dengan penanda teks, bukan <ul>/<ol>.
// ---------------------------------------------------------------------------

const WORD_LIST_PATTERN = /mso-list\s*:\s*l(\d+)\s+level(\d+)/i;

function isWordListParagraph(node: Element | null): node is HTMLElement {
  return Boolean(node && node.tagName === "P" && WORD_LIST_PATTERN.test(node.getAttribute("style") ?? ""));
}

function isIgnoredMarker(node: Element) {
  return /mso-list\s*:\s*ignore/i.test(node.getAttribute("style") ?? "");
}

/** Mengubah rangkaian paragraf daftar Word menjadi <ul>/<ol>/<li> bersarang sesuai level. */
function convertWordLists(document: Document) {
  const paragraphs = Array.from(document.body.querySelectorAll("p")).filter(isWordListParagraph);
  const handled = new Set<Element>();

  for (const first of paragraphs) {
    if (handled.has(first)) continue;

    // Kumpulkan paragraf daftar yang berurutan (abaikan teks spasi di antaranya).
    const group: HTMLElement[] = [];
    let cursor: Element | null = first;
    while (isWordListParagraph(cursor)) {
      group.push(cursor);
      handled.add(cursor);
      let next: ChildNode | null = cursor.nextSibling;
      while (next && next.nodeType === Node.TEXT_NODE && !(next.textContent ?? "").trim()) next = next.nextSibling;
      cursor = next && next.nodeType === Node.ELEMENT_NODE ? (next as Element) : null;
    }

    const root = document.createElement("div");
    const stack: { level: number; list: HTMLElement; listId: string; ordered: boolean }[] = [];

    for (const paragraph of group) {
      const match = WORD_LIST_PATTERN.exec(paragraph.getAttribute("style") ?? "");
      const level = match ? Number.parseInt(match[2], 10) : 1;
      const listId = match ? match[1] : "0";

      const markerNodes = Array.from(paragraph.querySelectorAll("span")).filter(isIgnoredMarker);
      const markerText = markerNodes
        .map((node) => node.textContent ?? "")
        .join("")
        .replace(/\u00a0/g, " ")
        .trim();
      markerNodes.forEach((node) => node.remove());

      const ordered = /^\(?[0-9a-zA-Z]{1,4}[.)]$/.test(markerText);

      while (stack.length > 0 && stack[stack.length - 1].level > level) stack.pop();

      // Daftar lain (ID Word berbeda atau jenis berpoin/bernomor berbeda) di level yang sama dimulai sebagai daftar baru.
      const top = stack[stack.length - 1];
      if (top && top.level === level && (top.listId !== listId || top.ordered !== ordered)) stack.pop();

      if (stack.length === 0 || stack[stack.length - 1].level < level) {
        const list = document.createElement(ordered ? "ol" : "ul");
        const parentList = stack[stack.length - 1]?.list;
        const parentItem = parentList?.lastElementChild;
        if (parentItem) parentItem.appendChild(list);
        else root.appendChild(list);
        stack.push({ level, list, listId, ordered });
      }

      const item = document.createElement("li");
      const content = document.createElement("p");
      while (paragraph.firstChild) content.appendChild(paragraph.firstChild);
      item.appendChild(content);
      stack[stack.length - 1].list.appendChild(item);
    }

    first.replaceWith(...Array.from(root.childNodes));
    group.slice(1).forEach((paragraph) => paragraph.remove());
  }
}

// ---------------------------------------------------------------------------
// Excel: gaya sel didefinisikan lewat kelas di blok <style> (misalnya .xl65 { font-weight:700 }).
// ---------------------------------------------------------------------------

function inlineExcelCellStyles(document: Document) {
  const css = Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("\n");
  if (!css.trim()) return;

  const rules = new Map<string, string>();
  for (const match of Array.from(css.matchAll(/\.([a-z][\w-]*)\s*\{([^}]*)\}/gi))) {
    rules.set(match[1], `${rules.get(match[1]) ?? ""};${match[2]}`);
  }

  document.body.querySelectorAll<HTMLElement>("td[class], th[class]").forEach((cell) => {
    const declarations = Array.from(cell.classList)
      .map((name) => rules.get(name) ?? "")
      .join(";");
    if (!declarations) return;

    const bold = /font-weight\s*:\s*(700|bold|bolder)/i.test(declarations);
    const italic = /font-style\s*:\s*italic/i.test(declarations);
    const align = /text-align\s*:\s*(left|center|right)/i.exec(declarations)?.[1];

    if (align && !cell.style.textAlign) cell.style.textAlign = align.toLowerCase();

    const wrapWith = (tag: string) => {
      const wrapper = document.createElement(tag);
      while (cell.firstChild) wrapper.appendChild(cell.firstChild);
      cell.appendChild(wrapper);
    };
    if (italic) wrapWith("em");
    if (bold) wrapWith("strong");
  });
}

export function normalizePastedHtml(html: string) {
  if (typeof DOMParser === "undefined" || !html) return html;

  const parsed = new DOMParser().parseFromString(html, "text/html");

  // Struktur dulu (membaca atribut style mentah), baru normalisasi gaya lewat CSSOM.
  convertWordLists(parsed);
  inlineExcelCellStyles(parsed);

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
