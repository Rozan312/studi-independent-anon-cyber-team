/**
 * Footer bersama (landmark contentinfo) untuk halaman depan, halaman auth, dan shell aplikasi:
 * identitas komunitas dan batas penggunaan platform. Teks sama dengan footer halaman depan sebelumnya.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-sm text-ink-3 ${className}`}>
      <div className="flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <span>Anon Cyber Team community learning platform</span>
        <span>Safe, defensive practice only: placeholder labs, no real targets.</span>
      </div>
    </footer>
  );
}
