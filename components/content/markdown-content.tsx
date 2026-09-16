import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Merender materi Markdown dari database. react-markdown tidak merender HTML mentah,
 * sehingga konten yang ditulis instruktur tidak dapat menyisipkan script.
 * Komponen ini tidak memakai "use client" agar bisa dipakai di server maupun client.
 */
export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  if (!content.trim()) return null;

  return (
    <div className={`prose-cyber ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
                {children}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
