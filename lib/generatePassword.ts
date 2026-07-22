import { randomInt } from "crypto";

// Karakter ambigu (0/O, 1/l/I) dihindari agar mudah dibaca & diketik ulang saat diserahkan ke user.
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_=+?";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function pick(charset: string) {
  return charset[randomInt(charset.length)];
}

// Menjamin hasil selalu lolos kebijakan password (huruf besar/kecil, angka, simbol)
// karena password ini yang dipakai sebagai password sementara sebelum user menggantinya.
export function generateTempPassword(length = 12): string {
  const required = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pick(ALL));
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
