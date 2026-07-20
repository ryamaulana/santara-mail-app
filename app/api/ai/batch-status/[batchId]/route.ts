import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCostUsd, getPricingSettings } from '@/lib/pricing';
import { getFastApiBase } from '@/lib/aiProxy';

export async function GET(request: Request, props: { params: Promise<{ batchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { batchId } = await props.params;

  try {
    const fastApiRes = await fetch(`${getFastApiBase()}/batch-status/${batchId}`);
    const data = await fastApiRes.json();

    if (fastApiRes.ok && Array.isArray(data.results)) {
      const successItems = data.results
        .map((item: any, index: number) => ({ item, index }))
        .filter(({ item }: any) => item.status === 'success' && item.usage);

      if (successItems.length > 0) {
        const pricing = await getPricingSettings();
        const logs = successItems.map(({ item, index }: any) => ({
          userId: user.id,
          requestKey: `${batchId}:${index}`,
          endpoint: 'batch-extract',
          model: item.usage.model,
          tokensIn: item.usage.input_tokens,
          tokensOut: item.usage.output_tokens,
          costUsd: calculateCostUsd(pricing, item.usage.input_tokens, item.usage.output_tokens),
        }));
        try {
          await prisma.usageLog.createMany({ data: logs, skipDuplicates: true });
        } catch (logError) {
          console.error('Gagal mencatat usage log batch:', logError);
        }
      }
    }

    return NextResponse.json(data, { status: fastApiRes.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghubungi layanan AI.' }, { status: 502 });
  }
}
