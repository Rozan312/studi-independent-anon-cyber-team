/**
 * Helper upload gambar dari browser ke POST /api/media (instruktur/admin).
 * Validasi di sini hanya untuk umpan balik cepat; server tetap memvalidasi isi file.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type UploadedImage = { url: string; fileName: string };

type UploadResponse = {
  data?: { url: string; fileName: string };
  error?: string;
};

export function isUploadableImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

export async function uploadImageFile(file: File): Promise<UploadedImage> {
  if (!isUploadableImage(file)) {
    throw new Error("This image format isn't supported. Use PNG, JPEG, GIF, or WebP.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("This image is larger than the 5 MB limit.");
  }

  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/media", { method: "POST", body });
  const payload = (await response.json().catch(() => ({}))) as UploadResponse;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "Couldn't upload the image.");
  }

  return { url: payload.data.url, fileName: payload.data.fileName };
}

/** Teks alt default dari nama file, misalnya "hunting-pipeline.png" menjadi "hunting pipeline". */
export function altFromFileName(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || "image";
}
