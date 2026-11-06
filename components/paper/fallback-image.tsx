"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

/**
 * <img> untuk URL gambar dari instruktur (logo dan cover). URL eksternal yang mati atau salah ketik
 * diganti `fallback` (misalnya kotak inisial, atau null untuk banner cover), bukan ikon gambar rusak.
 */
export function FallbackImage({
  src,
  alt,
  fallback,
  ...props
}: Omit<ComponentPropsWithoutRef<"img">, "src" | "alt" | "onError"> & {
  src: string;
  alt: string;
  /** Yang ditampilkan bila gambar gagal dimuat. */
  fallback: ReactNode;
}) {
  // Disimpan per URL agar src baru (navigasi klien) dicoba lagi dari awal.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Gambar dari HTML server bisa gagal sebelum React hydrate, sehingga onError tidak pernah terpanggil.
  // naturalWidth 0 juga terjadi pada SVG tanpa ukuran intrinsik; decode() hanya ditolak bila gambar memang rusak.
  useEffect(() => {
    const image = imageRef.current;
    if (!image || !image.complete || image.naturalWidth > 0) return;
    let active = true;
    image.decode().catch(() => {
      if (active) setFailedSrc(src);
    });
    return () => {
      active = false;
    };
  }, [src]);

  if (failedSrc === src) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imageRef} src={src} alt={alt} onError={() => setFailedSrc(src)} {...props} />;
}
