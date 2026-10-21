import type { ContentFormat } from "@prisma/client";
import { isRichHtmlEmpty, nestRichHtmlHeadings, renderRoomMaterialHtml } from "@/lib/content/rich-text";

/** Teks pengganti bawaan saat materi kosong: jujur soal kenapa kosong dan apa yang bisa dikerjakan. */
const defaultFallback = (
  <p className="rounded-lg border border-dashed border-line-strong bg-well px-4 py-3.5 text-sm leading-relaxed text-ink-2">
    The instructor hasn&apos;t added material to this room yet. Work through the tasks using the instructions in each one.
  </p>
);

/**
 * Materi room untuk tampilan student (server component). Mendukung format Markdown lama dan
 * HTML dari editor visual; keduanya disanitasi di server sebelum dikirim ke browser.
 * `fallback` ditampilkan bila materi kosong setelah disanitasi. `headingOffset` menggeser level heading
 * materi (lewat aria-level) agar pas di bawah heading halaman pemanggil.
 */
export function RoomMaterial({
  content,
  format,
  fallback = defaultFallback,
  headingOffset = 0,
  className = ""
}: {
  content: string;
  format: ContentFormat;
  fallback?: React.ReactNode;
  headingOffset?: number;
  className?: string;
}) {
  const rendered = renderRoomMaterialHtml(content, format);
  if (isRichHtmlEmpty(rendered)) return <>{fallback}</>;
  const html = nestRichHtmlHeadings(rendered, headingOffset);

  // HTML berasal dari sanitizeRichHtml (allowlist ketat), bukan input mentah.
  return <div className={`prose-cyber ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
