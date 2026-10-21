/** Nomor anggota bergaya nomor seri uang kertas, diturunkan dari id profil (bukan data karangan). */
export function memberSerial(id: string) {
  const compact = id.replace(/-/g, "").toUpperCase();
  return `ACT · ${compact.slice(0, 4)} · ${compact.slice(4, 8)}`;
}
