export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { id: "lowercase", label: "Ada huruf kecil (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "uppercase", label: "Ada huruf besar (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Ada angka (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "symbol", label: "Ada simbol (!@#$%...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function getPasswordPolicyError(password: string): string | null {
  const failed = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
  if (failed.length === 0) return null;
  return `Password harus memenuhi: ${failed.map((f) => f.label).join(", ")}`;
}
