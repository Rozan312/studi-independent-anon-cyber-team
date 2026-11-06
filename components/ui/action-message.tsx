export type ActionMessageState = {
  tone: "idle" | "success" | "error";
  message: string;
};

export function ActionMessage({
  state,
  inLiveRegion = false
}: {
  state: ActionMessageState;
  /**
   * Pesan dipasang di dalam wilayah status yang selalu ada (role="status" milik pemanggil), jadi tanpa role sendiri.
   * Dipakai bila elemen pemicunya ikut hilang setelah aksi berhasil (hapus task/pertanyaan/quiz).
   */
  inLiveRegion?: boolean;
}) {
  if (!state.message) return null;

  const success = state.tone === "success";

  return (
    <p
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-snug ${
        success ? "border-green/30 bg-green-soft text-ink" : "border-red/30 bg-red-soft text-ink"
      }`}
      role={inLiveRegion ? undefined : success ? "status" : "alert"}
    >
      <svg viewBox="0 0 16 16" className={`mt-0.5 h-4 w-4 shrink-0 ${success ? "text-green" : "text-red"}`} fill="none" stroke="currentColor" aria-hidden="true">
        {success ? (
          <path d="m3.5 8.5 3 3 6-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M8 3.5v5.5M8 11.8v.1" strokeWidth="1.8" strokeLinecap="round" />
        )}
      </svg>
      <span>{state.message}</span>
    </p>
  );
}
