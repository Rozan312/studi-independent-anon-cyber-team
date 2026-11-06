/**
 * Pola petunjuk di kolom jawaban task: setiap huruf/angka menjadi "*", spasi dan tanda baca tetap terlihat
 * ("false positive" → "***** ********", "ACT{flag_1}" → "***{****_*}"). Dihitung di server dari jawaban utama;
 * jawaban aslinya tidak pernah dikirim ke browser.
 *
 * Huruf beserta tanda diakritik gabungannya dihitung satu bintang, sesuai satu karakter yang diketik peserta.
 */
export function answerPattern(expected: string | null | undefined): string | null {
  const normalized = expected?.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.replace(/[\p{L}\p{N}]\p{M}*/gu, "*");
}
