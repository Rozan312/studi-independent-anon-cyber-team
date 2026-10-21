import type { ContentFormat } from "@prisma/client";
import { isRichHtmlEmpty, renderRoomMaterialHtml } from "@/lib/content/rich-text";

/**
 * Materi room untuk tampilan student (server component). Mendukung format Markdown lama dan
 * HTML dari editor visual; keduanya disanitasi di server sebelum dikirim ke browser.
 * `fallback` ditampilkan bila materi kosong setelah disanitasi.
 */
export function RoomMaterial({
  content,
  format,
  fallback = null,
  className = ""
}: {
  content: string;
  format: ContentFormat;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const html = renderRoomMaterialHtml(content, format);
  if (isRichHtmlEmpty(html)) return <>{fallback}</>;

  // HTML berasal dari sanitizeRichHtml (allowlist ketat), bukan input mentah.
  return <div className={`prose-cyber ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
