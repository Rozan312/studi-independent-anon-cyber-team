import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Kerangka halaman publik tanpa AppShell (halaman depan, 404, dan error boundary): bar atas bergaris tipis berisi logo,
 * nama, dan tombol tema; isi halaman (dengan <main> milik halaman itu sendiri); lalu footer bersama di dasar layar.
 * Lebar isi sama dengan halaman depan (max-w-6xl). Tanpa gradasi: dasar rata.
 */
export function PublicShell({
  children,
  brandHref = "/"
}: {
  children: React.ReactNode;
  /** Tujuan link logo; null di halaman depan agar tidak menautkan ke halaman itu sendiri. */
  brandHref?: string | null;
}) {
  const brand = (
    <>
      <BrandMark size={36} className="h-auto w-8 sm:w-9" />
      <span className="truncate font-display text-base font-bold leading-tight tracking-[-0.01em] text-ink">Anon Cyber Team</span>
    </>
  );
  const brandClass = "flex min-w-0 items-center gap-3";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-10">
          {brandHref ? (
            <nav aria-label="Site" className="min-w-0">
              <Link href={brandHref} aria-label="Anon Cyber Team home" className={`${brandClass} coarse:min-h-11`}>
                {brand}
              </Link>
            </nav>
          ) : (
            <div className={brandClass}>{brand}</div>
          )}
          <ThemeToggle variant="icon" />
        </div>
      </header>

      {/* Pembungkus blok: isi halaman memakai mx-auto biasa, dan footer tetap terdorong ke dasar layar. */}
      <div className="flex-1">{children}</div>

      <SiteFooter className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-10" />
    </div>
  );
}
