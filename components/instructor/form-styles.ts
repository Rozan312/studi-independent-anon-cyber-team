/**
 * Kelas Tailwind bersama untuk halaman staf (authoring instruktur/admin) dan form lain (auth, task).
 * Definisi dasarnya (.sheet, .input, .btn-*, .field-label) ada di app/globals.css.
 */

/** Field teks/select/textarea: tepi line-input, dasar halaman di dalam panel, fokus cyan. */
export const inputClass = "input mt-1.5";

/** Label di atas field: Red Hat Display, kalimat biasa agar label panjang tetap mudah dibaca. */
export const labelClass = "block font-display text-sm font-semibold text-ink";

/** Teks bantuan di bawah field. */
export const helpClass = "mt-1 text-xs leading-relaxed text-ink-3";

export const primaryButtonClass = "btn-primary";

export const secondaryButtonClass = "btn-secondary";

export const ghostButtonClass = "btn-ghost btn-sm";

export const dangerButtonClass = "btn-danger btn-sm";

/** Kotak centang dan radio: warna kendali aktif (cyan logo), bukan warna status. */
export const checkboxClass = "h-4 w-4 shrink-0 rounded border-line-input accent-cyan-ink";

/** Panel form: rata di atas dasar, sambungan tipis, tanpa bayangan. */
export const panelClass = "sheet p-5 md:p-6";

/** Panel daftar/tabel: baris kepala dipisah sambungan tipis, baris isi rata ke tepi panel. */
export const listPanelClass = "sheet overflow-hidden";

export const panelHeadClass = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5 sm:px-6";

export const panelTitleClass = "text-base font-bold text-ink";

/** Keterangan di baris kepala panel (jumlah, catatan singkat). */
export const panelMetaClass = "text-sm text-ink-3";

/** Baris daftar yang seluruhnya tautan: latar well saat disorot dan judulnya menjadi cyan (lihat rowTitleClass). */
export const rowLinkClass = "group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:px-6";

export const rowTitleClass = "block truncate font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink";

/** Judul yang berdiri sebagai tautan di baris berisi tombol (bukan seluruh baris tautan). */
export const titleLinkClass = "tap-target font-display font-semibold text-ink transition-colors hover:text-cyan-ink";

/** Tabel staf yang rapat: kepala setinggi 36 px, sel padat, sel pertama/terakhir sejajar dengan baris kepala panel. */
export const headCellClass =
  "field-label h-9 whitespace-nowrap border-b border-line px-3 text-left align-middle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6";

export const bodyCellClass = "px-3 py-2 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6";

export const tableRowClass = "transition-colors hover:bg-well";

export const idleActionState = { tone: "idle" as const, message: "" };
