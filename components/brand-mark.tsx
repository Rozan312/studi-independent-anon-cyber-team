import Image from "next/image";

/**
 * Logo resmi Anon Cyber Team (kubus heksagonal isometrik). Dekoratif: nama selalu ditulis di sebelahnya atau di aria-label link.
 * `priority` hanya untuk logo yang menjadi gambar utama panel (AuthFrame); logo kecil di shell tidak di-preload tetapi juga tidak ditunda.
 */
export function BrandMark({ size = 36, className = "", priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/act-256.png"
      alt=""
      aria-hidden="true"
      width={size}
      // Rasio mengikuti file act-256.png (256x241). next/image membandingkan atribut dengan img.height, yaitu tinggi
      // render yang dibulatkan ke bilangan terdekat (44 -> 41,42 px -> 41), jadi atribut dibulatkan dengan cara yang sama.
      height={Math.round(size * (241 / 256))}
      priority={priority}
      loading={priority ? undefined : "eager"}
      className={`shrink-0 select-none ${className}`}
    />
  );
}
