import { getAuditLog } from "@/lib/data"
import { AuditTrailClient } from "@/components/audit-trail-client"

export default async function AuditTrailPage() {
  const events = await getAuditLog()
  return <AuditTrailClient events={events} />
}
