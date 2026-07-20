import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCostUsd, getPricingSettings } from '@/lib/pricing';
import { getFastApiBase, checkQuota, checkAiAccess, quotaExceededMessage } from '@/lib/aiProxy';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accessStatus = await checkAiAccess(user.id);
  if (!accessStatus.allowed) {
    return NextResponse.json({ error: accessStatus.reason }, { status: 403 });
  }

  const quotaStatus = await checkQuota(user.id);
  if (!quotaStatus.allowed) {
    return NextResponse.json({ error: quotaExceededMessage(quotaStatus) }, { status: 429 });
  }

  try {
    const formData = await request.formData();

    const fastApiRes = await fetch(`${getFastApiBase()}/extract-surat`, {
      method: 'POST',
      body: formData,
    });
    const data = await fastApiRes.json();

    if (fastApiRes.ok && data.usage) {
      try {
        const pricing = await getPricingSettings();
        await prisma.usageLog.create({
          data: {
            userId: user.id,
            requestKey: crypto.randomUUID(),
            endpoint: 'extract-surat',
            model: data.usage.model,
            tokensIn: data.usage.input_tokens,
            tokensOut: data.usage.output_tokens,
            costUsd: calculateCostUsd(pricing, data.usage.input_tokens, data.usage.output_tokens),
          },
        });
      } catch (logError) {
        console.error('Gagal mencatat usage log:', logError);
      }
    }

    return NextResponse.json(data, { status: fastApiRes.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghubungi layanan AI.' }, { status: 502 });
  }
}
