import { Prisma } from "@prisma/client";

/**
 * Error yang pesannya ditulis untuk pengguna dan aman ditampilkan apa adanya di form atau respons API.
 * Error lain (Prisma, koneksi, bug) tidak pernah ditampilkan; pengguna melihat pesan fallback.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** redirect(), notFound(), dan penanda rute dinamis dari Next.js harus dilempar ulang agar Next.js yang menanganinya. */
function isNextControlError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;

  const digest = String((error as { digest?: unknown }).digest);
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND") || digest === "DYNAMIC_SERVER_USAGE";
}

/**
 * Pesan error yang boleh dilihat pengguna. Error tak terduga dicatat di log server lalu diganti `fallback`,
 * sehingga teks internal seperti "Invalid `prisma.x.create()` invocation" tidak sampai ke layar.
 */
export function userMessage(error: unknown, fallback: string): string {
  if (isNextControlError(error)) throw error;

  if (error instanceof UserFacingError) return error.message;

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
    if (target.includes("slug")) return "That slug is already used. Choose another one.";
  }

  console.error(`[error] ${fallback}`, error);
  return fallback;
}
