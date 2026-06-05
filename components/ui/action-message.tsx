export type ActionMessageState = {
  tone: "idle" | "success" | "error";
  message: string;
};

export function ActionMessage({ state }: { state: ActionMessageState }) {
  if (!state.message) return null;

  const toneClass =
    state.tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : "border-rose-500/25 bg-rose-500/10 text-rose-200";

  const dotClass = state.tone === "success" ? "bg-emerald-300" : "bg-rose-300";

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs font-medium leading-relaxed ${toneClass}`} role="status">
      <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${dotClass}`} />
      {state.message}
    </div>
  );
}
