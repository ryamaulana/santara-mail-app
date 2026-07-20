export type DisplayCurrency = "USD" | "IDR";

export function formatMoney(usd: number, currency: DisplayCurrency, usdToIdr: number | null): string {
  if (currency === "IDR" && usdToIdr) {
    return `Rp${Math.round(usd * usdToIdr).toLocaleString("id-ID")}`;
  }
  return `$${usd.toFixed(4)}`;
}
