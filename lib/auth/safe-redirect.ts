const DEFAULT_PATH = "/dashboard";

/**
 * Menerima nilai `next` dari query/form dan mengembalikan path relatif yang aman.
 * Menolak URL absolut, protocol-relative (`//`), backslash, karakter kontrol,
 * dan halaman auth agar tidak terjadi open redirect atau loop login.
 */
export function resolveNextPath(value: unknown, fallback = DEFAULT_PATH) {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  if (/^\/(login|register|forgot-password|reset-password)(\/|\?|$)/.test(candidate)) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(candidate)) return fallback;

  return candidate;
}
