import { CronJobDetailView } from "@/components/cron/cron-job-detail";

export default async function CronJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CronJobDetailView id={id} />;
}
