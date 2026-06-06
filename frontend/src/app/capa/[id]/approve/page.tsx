import { getFinding, getCapa } from "@/lib/data"
import { ApproveClient } from "@/components/approve-client"

export default async function ApprovePage({
  params,
}: {
  params: { id: string }
}) {
  const [finding, capa] = await Promise.all([
    getFinding(params.id),
    getCapa(params.id),
  ])
  return <ApproveClient id={params.id} finding={finding} capa={capa} />
}
