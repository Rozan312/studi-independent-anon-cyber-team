export function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-xl border border-primary-container/40 bg-primary-container/10 text-primary shadow-[0_0_18px_rgba(77,142,255,0.22)] ${
        collapsed ? "h-10 w-10" : "h-11 w-11"
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
        <path
          d="M16 3.8 25.5 7.4v7.2c0 6.2-3.8 10.8-9.5 13.6-5.7-2.8-9.5-7.4-9.5-13.6V7.4L16 3.8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M16 9.2v13.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M10.8 13.2h10.4M12.4 18.2h7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="16" cy="9.2" r="1.6" fill="currentColor" />
        <circle cx="10.8" cy="13.2" r="1.3" fill="currentColor" />
        <circle cx="21.2" cy="13.2" r="1.3" fill="currentColor" />
        <circle cx="12.4" cy="18.2" r="1.3" fill="currentColor" />
        <circle cx="19.6" cy="18.2" r="1.3" fill="currentColor" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#0c0f17] bg-emerald-400 shadow-[0_0_12px_rgba(78,222,163,0.9)]" />
    </span>
  );
}
