import "server-only";

import sanitizeHtml from "sanitize-html";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { ContentFormat } from "@prisma/client";
import { isAllowedImageSrc, readableBackgroundColor, readableTextColor } from "@/lib/content/rich-text-config";

/**
 * Pengolahan materi room di server.
 *
 * Materi dapat berformat MARKDOWN (data lama dan seed) atau HTML (hasil editor visual).
 * HTML SELALU disanitasi dengan allowlist ketat sebelum disimpan dan sebelum dirender,
 * karena materi ditulis instruktur lalu ditampilkan ke student.
 */

const COLOR_PATTERNS = [
  /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(?:,\s*(?:0|1|0?\.\d+|\d{1,3}%)\s*)?\)$/i,
  /^rgba?\(\s*\d{1,3}%?\s+\d{1,3}%?\s+\d{1,3}%?\s*(?:\/\s*(?:0|1|0?\.\d+|\d{1,3}%)\s*)?\)$/i
];

/** Ukuran font 8px sampai 96px (desimal diizinkan). */
const FONT_SIZE_PATTERN = /^(?:[89]|[1-8]\d|9[0-6])(?:\.\d{1,2})?px$/;

/** Hanya huruf, angka, spasi, koma, tanda kutip, dan tanda hubung: tidak bisa memuat url() atau ekspresi. */
const FONT_FAMILY_PATTERN = /^[a-z0-9 ,"'-]{1,120}$/i;

const TEXT_ALIGN_PATTERN = /^(?:left|right|center|justify)$/;
const CSS_LENGTH_PX_PATTERN = /^\d{1,4}(?:\.\d{1,2})?px$/;

function isAllowedColor(value: string | undefined) {
  return Boolean(value && COLOR_PATTERNS.some((pattern) => pattern.test(value.trim())));
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h1",
    "h2",
    "h3",
    "h4",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "sub",
    "sup",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "hr",
    "a",
    "img",
    "mark",
    "span",
    "table",
    "colgroup",
    "col",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "label",
    "input",
    "div"
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    ol: ["start", "type"],
    ul: ["data-type"],
    li: ["data-type", "data-checked"],
    input: ["type", "checked", "disabled"],
    mark: ["data-color", "style"],
    span: ["style"],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    table: ["style"],
    col: ["style"],
    th: ["colspan", "rowspan", "colwidth", "style"],
    td: ["colspan", "rowspan", "colwidth", "style"],
    code: ["class"],
    div: ["class"]
  },
  allowedClasses: {
    code: [/^language-[a-z0-9+#_-]{1,40}$/i],
    div: ["tableWrapper"]
  },
  allowedStyles: {
    "*": {
      "text-align": [TEXT_ALIGN_PATTERN]
    },
    span: {
      color: COLOR_PATTERNS,
      "background-color": COLOR_PATTERNS,
      "font-size": [FONT_SIZE_PATTERN],
      "font-family": [FONT_FAMILY_PATTERN]
    },
    mark: {
      "background-color": COLOR_PATTERNS,
      color: [/^inherit$/]
    },
    table: {
      width: [CSS_LENGTH_PX_PATTERN],
      "min-width": [CSS_LENGTH_PX_PATTERN]
    },
    col: {
      width: [CSS_LENGTH_PX_PATTERN],
      "min-width": [CSS_LENGTH_PX_PATTERN]
    }
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["https"]
  },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const next: Record<string, string> = {};
      if (href) next.href = href;
      if (attribs.title) next.title = attribs.title;

      if (/^https?:\/\//i.test(href)) {
        next.target = "_blank";
        next.rel = "noopener noreferrer nofollow";
      }

      return { tagName, attribs: next };
    },
    input: (tagName, attribs) => {
      // Satu-satunya input yang valid adalah checkbox daftar tugas; selalu nonaktif saat dirender.
      if (attribs.type !== "checkbox") return { tagName: "span", attribs: {} };
      const next: Record<string, string> = { type: "checkbox", disabled: "disabled" };
      if (attribs.checked !== undefined) next.checked = "checked";
      return { tagName, attribs: next };
    },
    li: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (attribs["data-type"] === "taskItem") {
        next["data-type"] = "taskItem";
        next["data-checked"] = attribs["data-checked"] === "true" ? "true" : "false";
      }
      return { tagName, attribs: next };
    },
    ul: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (attribs["data-type"] === "taskList") next["data-type"] = "taskList";
      return { tagName, attribs: next };
    },
    ol: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (attribs.start && /^\d{1,5}$/.test(attribs.start)) next.start = attribs.start;
      if (attribs.type && /^[1aAiI]$/.test(attribs.type)) next.type = attribs.type;
      return { tagName, attribs: next };
    },
    mark: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (isAllowedColor(attribs["data-color"])) next["data-color"] = attribs["data-color"].trim();
      if (attribs.style) next.style = attribs.style;
      return { tagName, attribs: next };
    },
    img: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (attribs.src) next.src = attribs.src;
      if (attribs.alt) next.alt = attribs.alt;
      if (attribs.title) next.title = attribs.title;
      if (attribs.width && /^\d{1,4}$/.test(attribs.width)) next.width = attribs.width;
      if (attribs.height && /^\d{1,4}$/.test(attribs.height)) next.height = attribs.height;
      next.loading = "lazy";
      return { tagName, attribs: next };
    },
    td: (tagName, attribs) => ({ tagName, attribs: sanitizeCellAttributes(attribs) }),
    th: (tagName, attribs) => ({ tagName, attribs: sanitizeCellAttributes(attribs) }),
    // Ukuran font dalam pt (Word, Google Docs) dikonversi ke px agar tidak hilang saat disaring.
    span: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (attribs.style) next.style = convertPtFontSizes(attribs.style);
      return { tagName, attribs: next };
    },
    // Editor hanya punya Judul 1-4; judul lebih kecil dari Markdown lama dipetakan ke Judul 4.
    h5: "h4",
    h6: "h4"
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !isAllowedImageSrc(frame.attribs.src),
  // Spasi beruntun yang diketik instruktur (misalnya untuk merapikan kolom) dipertahankan sebagai
  // spasi tak terputus, kecuali di kode yang memang memakai spasi biasa.
  textFilter: (text, tagName) => (tagName === "code" || tagName === "pre" ? text : text.replace(/ {2,}/g, (run) => ` ${"\u00a0".repeat(run.length - 1)}`))
};

function convertPtFontSizes(style: string) {
  return style.replace(/font-size\s*:\s*(\d{1,3}(?:\.\d+)?)pt/gi, (_match, points: string) => {
    const pixels = Math.round(Number.parseFloat(points) * (4 / 3));
    return `font-size: ${pixels}px`;
  });
}

function sanitizeCellAttributes(attribs: Record<string, string>) {
  const next: Record<string, string> = {};
  if (attribs.colspan && /^\d{1,3}$/.test(attribs.colspan)) next.colspan = attribs.colspan;
  if (attribs.rowspan && /^\d{1,3}$/.test(attribs.rowspan)) next.rowspan = attribs.rowspan;
  if (attribs.colwidth && /^\d{1,4}(?:,\d{1,4}){0,20}$/.test(attribs.colwidth)) next.colwidth = attribs.colwidth;

  let style = attribs.style ?? "";
  // Atribut align lama (tabel GFM) diubah menjadi text-align agar perataan kolom tetap terbaca.
  if (attribs.align && /^(left|center|right)$/i.test(attribs.align) && !/text-align/i.test(style)) {
    style = `${style ? `${style.replace(/;\s*$/, "")}; ` : ""}text-align: ${attribs.align.toLowerCase()}`;
  }
  if (style) next.style = style;
  return next;
}

/** Sanitasi HTML materi dengan allowlist ketat. Aman dipanggil berulang (idempoten untuk output yang sudah bersih). */
export function sanitizeRichHtml(html: string) {
  return sanitizeHtml(html ?? "", SANITIZE_OPTIONS).trim();
}

/** Teks polos dari HTML, untuk cek kosong dan hitung kata. */
export function richHtmlToPlainText(html: string) {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** HTML dianggap kosong bila tidak ada teks dan tidak ada gambar, garis, tabel, atau checkbox. */
export function isRichHtmlEmpty(html: string) {
  if (!html || !html.trim()) return true;
  if (/<(img|hr|table|input)\b/i.test(html)) return false;
  return richHtmlToPlainText(html).length === 0;
}

// ---------------------------------------------------------------------------
// Konversi Markdown lama -> HTML yang kompatibel dengan editor (TipTap)
// ---------------------------------------------------------------------------

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function hasClass(node: HastNode, className: string) {
  const value = node.properties?.className;
  return Array.isArray(value) ? value.includes(className) : value === className;
}

function textNode(value: string): HastNode {
  return { type: "text", value };
}

function element(tagName: string, properties: Record<string, unknown>, children: HastNode[]): HastNode {
  return { type: "element", tagName, properties, children };
}

function isInline(node: HastNode) {
  return node.type === "text" || (node.type === "element" && !["p", "ul", "ol", "pre", "blockquote", "table", "h1", "h2", "h3", "h4", "h5", "h6", "hr"].includes(node.tagName ?? ""));
}

/** Raw HTML di Markdown ditampilkan sebagai teks literal, sama seperti renderer lama (react-markdown). */
function rawToText(node: HastNode): HastNode {
  if (node.type === "raw") return textNode(node.value ?? "");
  if (node.children) node.children = node.children.map(rawToText);
  return node;
}

/** Gambar dengan alamat yang tidak diizinkan diganti link agar tidak hilang diam-diam. */
function unsupportedImagesToLinks(node: HastNode): HastNode {
  if (node.type === "element" && node.tagName === "img") {
    const src = typeof node.properties?.src === "string" ? node.properties.src : "";
    if (!isAllowedImageSrc(src)) {
      const alt = typeof node.properties?.alt === "string" && node.properties.alt.trim() ? node.properties.alt.trim() : src;
      return element("a", { href: src }, [textNode(`Image: ${alt}`)]);
    }
  }
  if (node.children) node.children = node.children.map(unsupportedImagesToLinks);
  return node;
}

/** Daftar centang GFM (`- [x] item`) diubah ke markup taskList/taskItem milik TipTap. */
function gfmTaskListsToTipTap(node: HastNode): HastNode {
  if (node.children) node.children = node.children.map(gfmTaskListsToTipTap);
  if (node.type !== "element" || node.tagName !== "ul" || !hasClass(node, "contains-task-list")) return node;

  node.properties = { dataType: "taskList" };
  node.children = (node.children ?? []).map((item) => {
    if (item.type !== "element" || item.tagName !== "li" || !hasClass(item, "task-list-item")) return item;

    let checked = false;
    const stripCheckbox = (children: HastNode[]): HastNode[] =>
      children
        .filter((child) => {
          if (child.type === "element" && child.tagName === "input") {
            checked = Boolean(child.properties?.checked);
            return false;
          }
          return true;
        })
        .map((child) => (child.type === "element" && child.tagName === "p" && child.children ? { ...child, children: stripCheckbox(child.children) } : child));

    const content = stripCheckbox(item.children ?? []);
    const firstText = content.find((child) => (child.type === "text" && (child.value ?? "").trim()) || child.tagName === "p");
    if (firstText?.type === "text" && firstText.value) firstText.value = firstText.value.replace(/^\s+/, "");
    if (firstText?.tagName === "p" && firstText.children?.[0]?.type === "text") {
      firstText.children[0].value = (firstText.children[0].value ?? "").replace(/^\s+/, "");
    }

    // Konten inline dibungkus <p>, blok (paragraf, daftar bersarang) dipertahankan.
    const blocks: HastNode[] = [];
    let inlineRun: HastNode[] = [];
    const flush = () => {
      if (inlineRun.some((child) => child.type !== "text" || (child.value ?? "").trim())) blocks.push(element("p", {}, inlineRun));
      inlineRun = [];
    };
    for (const child of content) {
      if (isInline(child)) inlineRun.push(child);
      else {
        flush();
        blocks.push(child);
      }
    }
    flush();

    return element("li", { dataType: "taskItem", dataChecked: checked ? "true" : "false" }, [
      element("label", {}, [element("input", { type: "checkbox", checked }, []), element("span", {}, [])]),
      element("div", {}, blocks.length > 0 ? blocks : [element("p", {}, [])])
    ]);
  });

  return node;
}

/**
 * Paragraf yang hanya berisi gambar diganti gambarnya saja. Gambar di editor adalah blok,
 * sehingga `<p><img></p>` akan menghasilkan paragraf kosong tambahan di atas gambar.
 */
function unwrapImageParagraphs(node: HastNode): HastNode {
  if (!node.children) return node;

  node.children = node.children.flatMap((child) => {
    const processed = unwrapImageParagraphs(child);
    if (processed.type !== "element" || processed.tagName !== "p" || !processed.children) return [processed];

    const meaningful = processed.children.filter((grandchild) => !(grandchild.type === "text" && !(grandchild.value ?? "").trim()));
    const onlyImages = meaningful.length > 0 && meaningful.every((grandchild) => grandchild.type === "element" && grandchild.tagName === "img");
    return onlyImages ? meaningful : [processed];
  });

  return node;
}

/** Blok kode Markdown membawa baris baru di akhir; buang agar editor tidak menampilkan baris kosong. */
function trimCodeBlockTrailingNewline(node: HastNode): HastNode {
  if (node.type === "element" && node.tagName === "pre") {
    const code = node.children?.find((child) => child.type === "element" && child.tagName === "code");
    const last = code?.children?.[code.children.length - 1];
    if (last?.type === "text" && last.value) last.value = last.value.replace(/\n$/, "");
  }
  node.children?.forEach(trimCodeBlockTrailingNewline);
  return node;
}

function rehypeLegacyMarkdownCompat() {
  return (tree: HastNode) =>
    trimCodeBlockTrailingNewline(unwrapImageParagraphs(gfmTaskListsToTipTap(unsupportedImagesToLinks(rawToText(tree)))));
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeLegacyMarkdownCompat)
  .use(rehypeStringify);

/** Konversi Markdown lama ke HTML bersih (untuk dibuka di editor visual atau dirender). */
export function markdownToHtml(markdown: string) {
  if (!markdown || !markdown.trim()) return "";
  const html = String(markdownProcessor.processSync(markdown));
  return sanitizeRichHtml(html);
}

/**
 * Bungkus setiap tabel dengan wadah gulir horizontal agar tabel lebar tidak merusak layout di layar
 * sempit, sambil tetap tampil selebar konten seperti di editor. Aman karena input sudah disanitasi
 * (tag seimbang) dan jumlah pembuka/penutup tabel selalu sama.
 */
function wrapTablesForDisplay(html: string) {
  return html.replace(/<table\b/gi, '<div class="table-scroll"><table').replace(/<\/table>/gi, "</table></div>");
}

// ---------------------------------------------------------------------------
// Pelindung keterbacaan warna di kertas terang
// ---------------------------------------------------------------------------

/**
 * Satu deklarasi CSS dari output sanitizer ("prop:nilai", dipisah ";"). Entitas seperti &quot; di
 * font-family memuat ";" sehingga dibaca utuh, bukan sebagai pemisah.
 */
const STYLE_DECLARATION_PATTERN = /([a-z-]+):((?:&[a-z0-9#]+;|[^;&])*)/gi;

function guardStyleColors(style: string) {
  const declarations: string[] = [];
  for (const [, property, value] of Array.from(style.matchAll(STYLE_DECLARATION_PATTERN))) {
    const name = property.toLowerCase();
    if (name === "color" || name === "background-color") {
      const guarded = name === "color" ? readableTextColor(value.trim()) : readableBackgroundColor(value.trim());
      if (guarded === null) continue;
      declarations.push(guarded === value.trim() ? `${property}:${value}` : `${property}:${guarded}`);
      continue;
    }
    declarations.push(`${property}:${value}`);
  }
  return declarations.join(";");
}

/**
 * Warna pilihan instruktur yang dibuat untuk tema gelap lama harus tetap terbaca di kertas terang.
 * Dijalankan saat materi dibuka di editor DAN saat dirender untuk student (keduanya lewat
 * roomMaterialToEditorHtml), sehingga editor menampilkan persis yang dilihat student. Isi database
 * tidak diubah; penyesuaian ikut tersimpan hanya bila instruktur menyimpan ulang materinya.
 *
 * - warna teks palet lama dipetakan ke palet baru; warna teks lain yang di bawah 4,5:1 di lembar, well, atau
 *   salah satu stabilo palet digelapkan (hue tetap), sehingga warna teks apa pun tetap terbaca di stabilo mana pun;
 * - stabilo palet lama dipetakan ke palet baru; latar span/stabilo lain yang lebih gelap dari stabilo palet tergelap
 *   dibuang (stabilo kembali ke kuning bawaan), sehingga pasangan warna teks + latar selalu di atas 4,5:1;
 * - warna yang sudah terbaca tidak diubah sama sekali.
 *
 * Bekerja pada output sanitizeRichHtml: hanya tag <span>/<mark> asli yang disentuh (teks selalu ter-escape,
 * jadi "<span" di dalam contoh kode tidak ikut), dan nilai pengganti dibuat sendiri (hex), bukan dari input.
 */
function applyReadableColors(html: string) {
  return html.replace(/<(span|mark)\b([^>]*)>/g, (_tag, tagName: string, attributes: string) => {
    let next = attributes.replace(/\sstyle="([^"]*)"/, (_match, style: string) => {
      const guarded = guardStyleColors(style);
      return guarded ? ` style="${guarded}"` : "";
    });
    if (tagName === "mark") {
      next = next.replace(/\sdata-color="([^"]*)"/, (_match, color: string) => {
        const guarded = readableBackgroundColor(color);
        return guarded === null ? "" : ` data-color="${guarded}"`;
      });
    }
    return `<${tagName}${next}>`;
  });
}

/** HTML untuk dibuka di editor visual, apa pun format penyimpanannya (tanpa pembungkus tampilan). */
export function roomMaterialToEditorHtml(content: string, format: ContentFormat) {
  if (!content || !content.trim()) return "";
  return applyReadableColors(format === "HTML" ? sanitizeRichHtml(content) : markdownToHtml(content));
}

/**
 * Penyesuaian khusus tampilan student agar sama dengan editor:
 * - `<br>` di akhir blok (Shift+Enter di akhir baris) digandakan, karena browser tidak menggambar
 *   baris kosong untuk satu `<br>` terakhir sedangkan editor menampilkannya;
 * - checkbox daftar centang diberi label tersembunyi untuk pembaca layar.
 */
function adjustForDisplay(html: string) {
  return html
    .replace(/<br\s*\/?>(?=<\/(?:p|h[1-4]|li|td|th)>)/gi, "<br /><br />")
    .replace(
      /(<li data-type="taskItem" data-checked="(true|false)"><label><input[^>]*>)<span><\/span><\/label>/g,
      (_match, start: string, checked: string) =>
        `${start.replace(/<input/, "<input aria-hidden=\"true\"")}<span class="sr-only">${checked === "true" ? "Done: " : "Not done: "}</span></label>`
    );
}

/** HTML siap tampil untuk student, apa pun format penyimpanannya. */
export function renderRoomMaterialHtml(content: string, format: ContentFormat) {
  return adjustForDisplay(wrapTablesForDisplay(roomMaterialToEditorHtml(content, format)));
}

/**
 * Normalisasi HTML dari editor sebelum disimpan: sanitasi, buang paragraf kosong di akhir dokumen
 * (ditambahkan otomatis oleh editor), lalu kosongkan bila tidak ada isi berarti (editor kosong
 * menghasilkan "<p></p>").
 */
export function prepareRichHtmlForStorage(html: string) {
  const clean = stripTrailingEmptyParagraphs(sanitizeRichHtml(html));
  return isRichHtmlEmpty(clean) ? "" : clean;
}

/** Buang `<p></p>` (atau berisi spasi/`<br>`) di akhir dokumen. Linear, tanpa regex bertingkat. */
function stripTrailingEmptyParagraphs(html: string) {
  let output = html.trimEnd();

  while (output.endsWith("</p>")) {
    const start = output.lastIndexOf("<p>");
    if (start < 0) break;

    const inner = output.slice(start + 3, output.length - 4);
    if (!/^(?:\s|&nbsp;|\u00a0|<br\s*\/?>)*$/i.test(inner)) break;
    output = output.slice(0, start).trimEnd();
  }

  return output;
}

/**
 * Materi instruktur boleh memakai Heading 1–4, padahal halaman room sudah punya h1 (judul halaman dari
 * AppShell) dan h2 per seksi (Material, Tasks, Your progress). Supaya kerangka heading untuk pembaca
 * layar tetap benar, level heading materi digeser di bawah seksi "Material" lewat aria-level
 * (Heading 1 → level 3, Heading 2 → level 4, …, maksimal 6).
 *
 * Tag aslinya dipertahankan: .prose-cyber menata h1–h4 per tag, jadi tampilan tetap sama persis dengan
 * editor, dan isi database tidak diubah. Aman sebagai regex karena HTML berasal dari renderRoomMaterialHtml
 * (sanitize-html meng-escape "<" di teks dan atribut, dan atribut heading hanya `style`), sehingga
 * "<h1" hanya bisa berupa tag sungguhan.
 */
export function nestRichHtmlHeadings(html: string, offset: number) {
  if (offset <= 0) return html;
  return html.replace(/<h([1-6])(?=[\s>])/gi, (_match, level: string) => `<h${level} aria-level="${Math.min(6, Number(level) + offset)}"`);
}
