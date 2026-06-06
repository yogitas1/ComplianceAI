"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Play, Search, AlertTriangle, Boxes, FileWarning, ClipboardList, Activity } from "lucide-react"
import { API_BASE, type Batch } from "@/lib/data"

type Phase = "idle" | "scanning" | "alert"

const DEMO_BATCH = "BCH-2024-0892"

export function DashboardClient({ batches }: { batches: Batch[] }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("idle")

  const deviations = batches.filter((b) => b.status === "deviation").length

  const stats = [
    { label: "Total Batches", value: batches.length, icon: Boxes, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Findings", value: deviations, icon: FileWarning, color: "text-critical", bg: "bg-red-50" },
    { label: "Open CAPAs", value: deviations, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Systems Monitored", value: 2, icon: Activity, color: "text-compliant", bg: "bg-green-50" },
  ]

  async function handleBreach() {
    if (phase !== "idle") return
    setPhase("scanning")
    // fire detection but never block the demo on it
    try {
      void fetch(`${API_BASE}/api/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "live_breach" }),
        signal: AbortSignal.timeout(6000),
      }).catch((e) => console.log("[v0] /api/detect fallback", e?.message))
    } catch (e) {
      console.log("[v0] /api/detect threw", (e as Error)?.message)
    }
    setTimeout(() => setPhase("alert"), 2000)
  }

  return (
    <div className="px-8 py-7 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AuditAI</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manufacturing Compliance Intelligence</p>
        </div>
        <button
          onClick={handleBreach}
          disabled={phase !== "idle"}
          className="inline-flex items-center gap-2 rounded-lg bg-critical px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf4848] disabled:opacity-60"
        >
          <Play className="h-4 w-4 fill-white" />
          Simulate Live Breach
        </button>
      </header>

      {/* Stat cards */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </section>

      {/* Banner */}
      {phase === "scanning" && (
        <div className="scan-banner mt-6 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3.5 text-amber-800">
          <Search className="h-5 w-5" />
          <span className="text-sm font-medium">Scanning batch records across ERP and eQMS...</span>
        </div>
      )}
      {phase === "alert" && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-critical mt-0.5" />
            <div className="text-sm text-critical">
              <span className="font-bold">Critical Finding Detected</span> — BCH-2024-0892 | CardioFlow
              Valve 3mm | Temperature excursion 28.4°C
            </div>
          </div>
          <button
            onClick={() => router.push("/findings/1")}
            className="shrink-0 rounded-lg bg-critical px-4 py-2 text-sm font-semibold text-white hover:bg-[#cf4848]"
          >
            View Finding →
          </button>
        </div>
      )}

      {/* Table */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Batch Records</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Batch ID</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Temp Reading</th>
                <th className="px-4 py-3 font-semibold">Spec Range</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => {
                const breach = b.temp_reading > b.spec_max
                const highlight = phase === "alert" && b.batch_id === DEMO_BATCH
                return (
                  <tr
                    key={b.batch_id}
                    className={`bg-white ${highlight ? "row-breach" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium font-mono text-xs">{b.batch_id}</td>
                    <td className="px-4 py-3 text-slate-700">{b.product}</td>
                    <td
                      className={`px-4 py-3 font-semibold tabular-nums ${
                        breach ? "text-critical" : "text-compliant"
                      }`}
                    >
                      {b.temp_reading.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {b.spec_min}–{b.spec_max}°C
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "deviation" ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-critical">
                          Deviation
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-compliant">
                          Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
