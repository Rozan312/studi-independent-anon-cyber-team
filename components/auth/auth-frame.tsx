import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { CircuitField } from "@/components/paper/circuit";

/**
 * Bingkai halaman publik dan auth (tanpa AppShell).
 * Kiri: panel iris bergrid titik dengan logo, nama, dan bidang jalur sirkuit sebagai latar dekoratif.
 * Kanan: satu lembar kertas berisi judul halaman (h1) dan formulirnya.
 * Di layar kecil panel menyusut menjadi pita atas yang ringkas (tanpa bidang sirkuit).
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
  /** Tujuan link logo; null di halaman depan agar tidak menautkan ke halaman itu sendiri. */
  brandHref?: string | null;
}) {
  const brand = (
    <>
      <BrandMark size={96} className="h-auto w-11 lg:w-24" />
      <span className="text-base font-bold leading-tight tracking-[-0.01em] text-ink lg:text-[1.75rem] lg:tracking-[-0.018em]">
        Anon Cyber Team
      </span>
    </>
  );
  const brandClass = "inline-flex items-center gap-3 lg:flex-col lg:items-start lg:gap-6";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,5fr)_minmax(0,7fr)]">
      <aside
        className="digital-surface relative overflow-hidden border-b border-line lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r"
      >
        {/* Jalur sirkuit di bagian bawah panel, memudar ke atas agar logo dan teks tetap bersih. */}
        <CircuitField className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[60%] w-full [mask-image:linear-gradient(to_top,black_40%,transparent)] lg:block" />
        <div className="relative px-4 py-4 sm:px-6 lg:px-12 lg:pt-14 xl:px-16 xl:pt-16">
          {brandHref ? (
            <Link href={brandHref} aria-label="Anon Cyber Team home" className={brandClass}>
              {brand}
            </Link>
          ) : (
            <div className={brandClass}>{brand}</div>
          )}
          <p className="mt-3 hidden max-w-xs text-[0.9375rem] leading-relaxed text-ink-2 lg:block">
            Self-paced cybersecurity learning paths from the Anon Cyber Team community.
          </p>
        </div>
      </aside>

      <main className="flex justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center lg:px-10 lg:py-16">
        <div className="sheet w-full max-w-md p-6 sm:p-8">
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.018em] text-ink [text-wrap:balance]">{title}</h1>
          {description ? <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
