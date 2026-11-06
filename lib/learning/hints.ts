/** Hint task dibuka setelah sejumlah percobaan salah agar peserta tetap mencoba dulu. */
export const HINT_UNLOCK_AFTER_WRONG_ATTEMPTS = 2;

export function isHintUnlocked(wrongAttempts: number) {
  return wrongAttempts >= HINT_UNLOCK_AFTER_WRONG_ATTEMPTS;
}
