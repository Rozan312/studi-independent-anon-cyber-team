import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Bingkai halaman auth (masuk, daftar, lupa dan atur ulang kata sandi) dan cadangan global-error, tanpa AppShell.
 * Desktop: kolom merek sempit bergradasi rail (satu-satunya gradasi) dengan posisi logo sama seperti rail aplikasi,
 * kalimat komunitas di bawahnya, dan baris Light mode di dasar kolom. Kanan: dasar halaman tanpa kotak; judul,
 * deskripsi, formulir, dan link sekunder rata kiri dalam satu lebar baca, dipisah garis tipis seperti halaman aplikasi.
 * Layar kecil: kolom merek menjadi bar atas rata (logo, nama, tombol tema ikon) seperti bar atas ponsel di aplikasi.
 */
export function AuthFrame({
  title,
  description,
  children,
  brandHref = "/"
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Tujuan link logo; null bila halaman itu sendiri adalah tujuannya. */
  brandHref?: string | null;
}) {
  const brand = (
    <>
      <BrandMark size={38} className="h-auto w-8 lg:w-[38px]" />
      <span className="truncate font-display text-base font-bold leading-tight tracking-[-0.01em] text-ink">Anon Cyber Team</span>
    </>
  );
  const brandClass = "flex min-w-0 items-center gap-3";

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
      <header className="border-b border-line lg:rail-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-5 lg:py-5">
          {brandHref ? (
            <nav aria-label="Site" className="min-w-0">
              <Link href={brandHref} aria-label="Anon Cyber Team home" className={`${brandClass} coarse:min-h-11`}>
                {brand}
              </Link>
            </nav>
          ) : (
            <div className={brandClass}>{brand}</div>
          )}
          {/* Tombol tema ikon hanya di bar atas layar kecil; di desktop tombolnya baris rail di dasar kolom. */}
          <div className="lg:hidden">
            <ThemeToggle variant="icon" />
          </div>
        </div>
        <p className="hidden max-w-[20ch] px-5 pt-2 font-display text-lg font-semibold leading-snug tracking-[-0.01em] text-ink-2 [text-wrap:balance] lg:block">
          Self-paced cybersecurity learning paths from the Anon Cyber Team community.
        </p>
        <div className="mt-auto hidden border-t border-line/80 pb-3 pt-3 lg:block">
          <ThemeToggle variant="rail" />
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:min-h-screen">
        <main className="flex flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14 lg:justify-center lg:px-12 lg:py-16 xl:px-16">
          <div className="w-full max-w-[27rem]">
            <div className="border-b border-line pb-5">
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink [text-wrap:balance] lg:text-[2rem]">{title}</h1>
              {description ? <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{description}</p> : null}
            </div>
            <div className="pt-6">{children}</div>
          </div>
        </main>
        <SiteFooter className="px-4 pb-8 sm:px-6 lg:px-12 xl:px-16" />
      </div>
    </div>
  );
}
