import { getFinding, getCapa } from "@/lib/data"
import { FindingClient } from "@/components/finding-client"

export default async function FindingPage({
  params,
}: {
  params: { id: string }
}) {
  const [finding, capa] = await Promise.all([
    getFinding(params.id),
    getCapa(params.id),
  ])
  return <FindingClient finding={finding} capa={capa} />
}
