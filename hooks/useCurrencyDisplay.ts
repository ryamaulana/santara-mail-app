"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DisplayCurrency } from "@/lib/currency";

const STORAGE_KEY = "sipedig:displayCurrency";

async function fetchExchangeRate(): Promise<{ usdToIdr: number; fetchedAt: string }> {
  const res = await fetch("/api/admin/exchange-rate");
  if (!res.ok) throw new Error("Gagal memuat kurs USD/IDR");
  return res.json();
}

export function useCurrencyDisplay(enabled: boolean) {
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "USD" || stored === "IDR") setCurrency(stored);
  }, []);

  const setAndPersist = (next: DisplayCurrency) => {
    setCurrency(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  // Baru nembak API kurs begitu admin benar-benar pilih IDR — jarang berubah
  // (cache server 6 jam), jadi staleTime di sisi client dibuat 1 jam saja
  // biar gak nembak ulang tiap kali pindah halaman/tab.
  const exchangeRateQuery = useQuery({
    queryKey: ["admin", "exchange-rate"],
    queryFn: fetchExchangeRate,
    enabled: enabled && currency === "IDR",
    staleTime: 60 * 60 * 1000,
  });

  return {
    currency,
    setCurrency: setAndPersist,
    usdToIdr: exchangeRateQuery.data?.usdToIdr ?? null,
    isRateLoading: exchangeRateQuery.isLoading,
    isRateError: exchangeRateQuery.isError,
  };
}
