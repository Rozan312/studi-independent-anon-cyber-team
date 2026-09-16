import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  detectImageMimeType,
  readStoredFile,
  saveImageBuffer
} from "@/lib/storage/local-storage";

export function mediaUrl(assetId: string) {
  return `/api/media/${assetId}`;
}

function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "upload";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return (cleaned || "upload").slice(0, 120);
}

/**
 * Menyimpan gambar yang diunggah instruktur/admin. Tipe file ditentukan dari
 * magic bytes, bukan dari header client, dan dibatasi ke PNG/JPEG/GIF/WebP.
 */
export async function storeImageUpload(uploaderId: string, file: { name: string; size: number; arrayBuffer(): Promise<ArrayBuffer> }) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran file melebihi batas 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageMimeType(buffer);

  if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new Error("Format gambar tidak didukung. Gunakan PNG, JPEG, GIF, atau WebP.");
  }

  const storageKey = await saveImageBuffer(buffer, mimeType);

  const asset = await prisma.mediaAsset.create({
    data: {
      uploaderId,
      fileName: sanitizeFileName(file.name),
      mimeType,
      sizeBytes: buffer.length,
      storageKey
    }
  });

  return { asset, url: mediaUrl(asset.id) };
}

export async function getMediaAsset(assetId: string) {
  return prisma.mediaAsset.findUnique({ where: { id: assetId } });
}

export async function readMediaAssetFile(assetId: string) {
  const asset = await getMediaAsset(assetId);
  if (!asset) return null;

  const body = await readStoredFile(asset.storageKey);
  return { asset, body };
}

export async function listMediaAssets(uploaderId: string, limit = 24) {
  const rows = await prisma.mediaAsset.findMany({
    where: { uploaderId },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return rows.map((asset) => ({ ...asset, url: mediaUrl(asset.id) }));
}
