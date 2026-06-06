import { getBatches } from "@/lib/data"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const batches = await getBatches()
  return <DashboardClient batches={batches} />
}
