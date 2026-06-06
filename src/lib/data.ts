export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://compliance-ai-three.vercel.app"

export type Batch = {
  batch_id: string
  product: string
  temp_reading: number
  spec_min: number
  spec_max: number
  status: "compliant" | "deviation"
}

export type Finding = {
  id: number
  severity: string
  regulatory_ref: string
  description: string
  status: string
  batch_id: string
  product: string
  temp_reading: number
  spec_min: number
  spec_max: number
  operator: string
  production_date: string
}

export type Capa = {
  finding_id: number
  root_cause: string
  corrective_action: string
  regulatory_ref: string
  drafted_by: string
  status: string
}

export type AuditEvent = {
  step: number
  actor: string
  description: string
  type: "automated" | "human"
}

function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export const FALLBACK_BATCHES: Batch[] = [
  {
    batch_id: "BCH-2024-0888",
    product: "CardioFlow Valve 3mm",
    temp_reading: 21.2,
    spec_min: 15,
    spec_max: 25,
    status: "compliant",
  },
  {
    batch_id: "BCH-2024-0889",
    product: "NeuroPatch Electrode Array",
    temp_reading: 18.7,
    spec_min: 15,
    spec_max: 25,
    status: "compliant",
  },
  {
    batch_id: "BCH-2024-0890",
    product: "CardioFlow Valve 3mm",
    temp_reading: 22.1,
    spec_min: 15,
    spec_max: 25,
    status: "compliant",
  },
  {
    batch_id: "BCH-2024-0891",
    product: "SpinalSync Implant",
    temp_reading: 19.4,
    spec_min: 15,
    spec_max: 25,
    status: "compliant",
  },
  {
    batch_id: "BCH-2024-0892",
    product: "CardioFlow Valve 3mm",
    temp_reading: 28.4,
    spec_min: 15,
    spec_max: 25,
    status: "deviation",
  },
]

export const FALLBACK_FINDING: Finding = {
  id: 1,
  severity: "critical",
  regulatory_ref: "21 CFR Part 820.100",
  description:
    "Temperature excursion detected — 28.4°C exceeds maximum spec of 25°C. No deviation report filed in eQMS.",
  status: "capa_drafted",
  batch_id: "BCH-2024-0892",
  product: "CardioFlow Valve 3mm",
  temp_reading: 28.4,
  spec_min: 15,
  spec_max: 25,
  operator: "OP-441",
  production_date: yesterday(),
}

export const FALLBACK_CAPA: Capa = {
  finding_id: 1,
  root_cause:
    "Storage unit thermostat failure during overnight shift caused ambient temperature rise in controlled storage area.",
  corrective_action:
    "Immediate quarantine of batch BCH-2024-0892. Replace faulty thermostat unit. Retrain operator OP-441 on deviation reporting protocol. Conduct 30-day temperature monitoring audit.",
  regulatory_ref: "21 CFR Part 820.100",
  drafted_by: "AuditAI",
  status: "draft",
}

export const FALLBACK_AUDIT: AuditEvent[] = [
  {
    step: 1,
    actor: "AuditAI",
    description:
      "Batch BCH-2024-0892 temperature excursion detected (28.4°C vs 15-25°C spec)",
    type: "automated",
  },
  {
    step: 2,
    actor: "AuditAI",
    description:
      "Cross-referenced eQMS — no deviation report found for BCH-2024-0892",
    type: "automated",
  },
  {
    step: 3,
    actor: "AuditAI",
    description:
      "Evidence package assembled: batch record, SOP v2.3, operator log",
    type: "automated",
  },
  {
    step: 4,
    actor: "AuditAI",
    description:
      "CAPA drafted — root cause identified, corrective action recommended",
    type: "automated",
  },
  {
    step: 5,
    actor: "AuditAI",
    description: "QA Manager notified via mobile alert",
    type: "automated",
  },
  {
    step: 6,
    actor: "Sarah Chen, QA Director",
    description: "CAPA Approved ✓",
    type: "human",
  },
]

async function safeFetch<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    if (data == null || (Array.isArray(data) && data.length === 0)) return fallback
    return data as T
  } catch (e) {
    console.log("[v0] API fallback for", path, (e as Error)?.message)
    return fallback
  }
}

function normalizeBatch(raw: any): Batch {
  const min = raw.spec_min ?? raw.spec_range_min ?? 15
  const max = raw.spec_max ?? raw.spec_range_max ?? 25
  const temp = Number(raw.temp_reading ?? raw.temperature ?? 0)
  return {
    batch_id: raw.batch_id ?? raw.id ?? "—",
    product: raw.product ?? raw.product_name ?? "—",
    temp_reading: temp,
    spec_min: Number(min),
    spec_max: Number(max),
    status: temp > Number(max) || raw.status === "deviation" ? "deviation" : "compliant",
  }
}

export async function getBatches(): Promise<Batch[]> {
  const data = await safeFetch<any[]>("/api/batches", FALLBACK_BATCHES)
  try {
    const arr = Array.isArray(data) ? data : (data as any).batches
    if (!Array.isArray(arr) || arr.length === 0) return FALLBACK_BATCHES
    return arr.map(normalizeBatch)
  } catch {
    return FALLBACK_BATCHES
  }
}

export async function getFinding(id: string | number): Promise<Finding> {
  const data = await safeFetch<any>(`/api/findings/${id}`, FALLBACK_FINDING)
  try {
    if (!data || !data.id) return FALLBACK_FINDING
    return { ...FALLBACK_FINDING, ...data }
  } catch {
    return FALLBACK_FINDING
  }
}

export async function getCapa(id: string | number): Promise<Capa> {
  const data = await safeFetch<any>(`/api/capa/${id}`, FALLBACK_CAPA)
  try {
    if (!data || !data.root_cause) return FALLBACK_CAPA
    return { ...FALLBACK_CAPA, ...data }
  } catch {
    return FALLBACK_CAPA
  }
}

export async function getAuditLog(): Promise<AuditEvent[]> {
  const data = await safeFetch<any[]>("/api/audit-log", FALLBACK_AUDIT)
  try {
    const arr = Array.isArray(data) ? data : (data as any).events
    if (!Array.isArray(arr) || arr.length === 0) return FALLBACK_AUDIT
    return arr.map((e: any, i: number) => ({
      step: e.step ?? i + 1,
      actor: e.actor ?? "AuditAI",
      description: e.description ?? "",
      type: (e.type ?? (e.actor?.toLowerCase().includes("ai") ? "automated" : "human")) as
        | "automated"
        | "human",
    }))
  } catch {
    return FALLBACK_AUDIT
  }
}
