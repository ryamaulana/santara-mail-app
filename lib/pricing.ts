import 'server-only';
import prisma from '@/lib/prisma';

/**
 * Harga & margin sekarang di-manage lewat DB (PricingSettings, edit dari
 * /admin/usage), bukan .env — ini jadi tuas bisnis yang admin aktif atur,
 * bukan config yang jarang berubah. Groq tidak punya API untuk pricing, jadi
 * admin mengecek manual ke groq.com/pricing dan mengisi angkanya sendiri.
 */
export async function getPricingSettings() {
  try {
    return await prisma.pricingSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  } catch (error: any) {
    // Concurrent first-load race (e.g. the usage dashboard fires several
    // requests in parallel that all call this): another request's INSERT
    // won between our check and our own INSERT. The row exists now, so just
    // read it instead of failing the whole request.
    if (error?.code === 'P2002') {
      return prisma.pricingSettings.findUniqueOrThrow({ where: { id: 1 } });
    }
    throw error;
  }
}

export function calculateCostUsd(
  pricing: { groqInputPerMillion: number; groqOutputPerMillion: number },
  tokensIn: number,
  tokensOut: number
): number {
  return (tokensIn / 1_000_000) * pricing.groqInputPerMillion + (tokensOut / 1_000_000) * pricing.groqOutputPerMillion;
}

/** Harga jual ke user = cost riil + margin %. */
export function applyMargin(costUsd: number, marginPercent: number): number {
  return costUsd * (1 + marginPercent / 100);
}
