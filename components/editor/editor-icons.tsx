/** Ikon SVG kecil untuk toolbar editor. Semua dekoratif; label aksesibel ada di tombol. */

type IconProps = { className?: string };

function Svg({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const UndoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Svg>
);

export const RedoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </Svg>
);

export const AlignLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h10M4 18h14" />
  </Svg>
);

export const AlignCenterIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M7 12h10M5 18h14" />
  </Svg>
);

export const AlignRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M10 12h10M6 18h14" />
  </Svg>
);

export const AlignJustifyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const BulletListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </Svg>
);

export const OrderedListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 6h10M10 12h10M10 18h10" />
    <path d="M4 5h1v4M4 9h2M4 14.5c0-.8.6-1.5 1.3-1.5.8 0 1.2.6 1.2 1.2 0 .9-2.5 2.1-2.5 2.8h2.5" strokeWidth="1.5" />
  </Svg>
);

export const TaskListIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="6" height="6" rx="1" />
    <path d="m4.5 7 1.2 1.2L8 5.8" strokeWidth="1.6" />
    <rect x="3" y="14" width="6" height="6" rx="1" />
    <path d="M13 7h8M13 17h8" />
  </Svg>
);

export const IndentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 6h10M10 12h10M4 18h16" />
    <path d="m4 9 3 3-3 3" />
  </Svg>
);

export const OutdentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 6h10M10 12h10M4 18h16" />
    <path d="M7 9 4 12l3 3" />
  </Svg>
);

export const QuoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 7h3v4c0 2.5-1.5 4-3.5 4.5M15 7h3v4c0 2.5-1.5 4-3.5 4.5" />
  </Svg>
);

export const CodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />
  </Svg>
);

export const CodeBlockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m9 10-2 2 2 2M15 10l2 2-2 2" />
  </Svg>
);

export const HorizontalRuleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12h18" />
    <path d="M8 6h8M8 18h8" strokeOpacity="0.45" />
  </Svg>
);

export const LinkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </Svg>
);

export const ImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m21 16-5-5-9 9" />
  </Svg>
);

export const TableIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
  </Svg>
);

export const ClearFormatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 5h12M12 5 8 19" />
    <path d="m15 14 5 5M20 14l-5 5" />
  </Svg>
);

export const TextColorIcon = ({ color, className = "h-4 w-4" }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M7 16 12 4l5 12M8.6 12h6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* swatch-ink membalik warna pilihan di tema malam, sama dengan teks berwarna di materi (globals.css). */}
    <rect x="4" y="18.5" width="16" height="3" rx="1" fill={color || "currentColor"} className={color ? "swatch-ink" : undefined} />
  </svg>
);

export const HighlightIcon = ({ color, className = "h-4 w-4" }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="m14 4 6 6-8 8H6v-6l8-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="3" y="19" width="18" height="3" rx="1" fill={color || "rgba(250, 204, 21, 0.85)"} />
  </svg>
);
