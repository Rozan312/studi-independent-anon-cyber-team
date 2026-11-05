import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { UserFacingError } from "@/lib/errors";

/**
 * Provider penyimpanan file lokal (disk server). Dipakai oleh media-service.
 * Ganti modul ini dengan provider lain (S3, Supabase Storage) tanpa mengubah
 * pemanggil, selama kontrak fungsi di bawah dipertahankan.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp"
};

export const ALLOWED_IMAGE_MIME_TYPES = Object.keys(IMAGE_EXTENSIONS);

function uploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "storage/uploads");
}

/** Mendeteksi tipe gambar dari magic bytes, bukan dari header client. */
export function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  return null;
}

export function resolveStoragePath(storageKey: string) {
  // Kunci selalu "<uuid>.<ext>" sehingga tidak mungkin berisi path traversal.
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(storageKey)) {
    throw new Error("Invalid storage key.");
  }

  return path.join(uploadRoot(), storageKey);
}

export async function saveImageBuffer(buffer: Buffer, mimeType: string) {
  const extension = IMAGE_EXTENSIONS[mimeType];
  if (!extension) throw new UserFacingError("Unsupported image type.");
  if (buffer.length === 0) throw new UserFacingError("File is empty.");
  if (buffer.length > MAX_UPLOAD_BYTES) throw new UserFacingError("File exceeds the 5 MB limit.");

  await mkdir(uploadRoot(), { recursive: true });

  const storageKey = `${randomUUID()}.${extension}`;
  await writeFile(resolveStoragePath(storageKey), buffer, { flag: "wx" });

  return storageKey;
}

export async function readStoredFile(storageKey: string) {
  return readFile(resolveStoragePath(storageKey));
}

export async function deleteStoredFile(storageKey: string) {
  try {
    await unlink(resolveStoragePath(storageKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
