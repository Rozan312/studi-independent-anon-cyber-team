import Image from "next/image";

/** Logo resmi Anon Cyber Team (kubus heksagonal isometrik). Dekoratif: nama selalu ditulis di sebelahnya atau di aria-label link. */
export function BrandMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/act-256.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round(size * (766 / 811))}
      priority
      className={`shrink-0 select-none ${className}`}
    />
  );
}
