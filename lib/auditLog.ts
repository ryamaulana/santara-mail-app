import 'server-only';
import prisma from '@/lib/prisma';

/**
 * Mencatat aksi admin (siapa-kapan-ngapain) — untuk aksi sensitif seperti
 * ubah harga/margin, suspend user, tandai tagihan lunas. `details` TIDAK
 * BOLEH berisi password/hash asli, hanya penanda "(changed)".
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    // Prisma's Json input type doesn't accept a plain Record<string, unknown>
    // directly; `details` here is always a JSON-serializable plain object.
    await prisma.adminAuditLog.create({ data: params as any });
  } catch (error) {
    // Gagal mencatat log tidak boleh menggagalkan aksi admin yang sebenarnya
    // — pola sama seperti UsageLog di app/api/ai/*/route.ts.
    console.error('Gagal mencatat audit log:', error);
  }
}
