import { UsageDetailClient } from "./UsageDetailClient";

export default async function AdminUsageDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UsageDetailClient userId={userId} />;
}
