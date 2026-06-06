"use client"

import { useState } from "react"
import { Play, Search, AlertTriangle, Boxes, FileWarning, ClipboardList, Activity, X, CheckCircle } from "lucide-react"
import { API_BASE, type Batch } from "@/lib/data"

type Phase = "idle" | "scanning" | "alert"

const DEMO_BATCH = "BCH-2024-0892"

const FALLBACK_FINDING = {
  severity: "critical",
  regulatory_ref: "21 CFR 820.80(b) & 21 CFR 820.90",
  description: "Temperature reading 28.4°C exceeds maximum spec of 25°C. No deviation report filed in eQMS.",
  root_cause: "Storage unit thermostat failure during overnight shift caused ambient temperature rise in controlled storage area.",
  corrective_action: "Immediate quarantine of batch BCH-2024-0892. Replace faulty thermostat unit. Retrain operator OP-441 on deviation reporting protocol.",
  drafted_by: "AuditAI",
}

export function DashboardClient({ batches }: { batches: Batch[] }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [showModal, setShowModal] = useState(false)
  const [approved, setApproved] = useState(false)
  const [finding, setFinding] = useState(FALLBACK_FINDING)
  const [showNotification, setShowNotification] = useState(false)

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
    try {
      const res = await fetch(`${API_BASE}/api/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.findings?.[0]) {
          const f = data.findings[0]
          const capaRes = await fetch(`${API_BASE}/api/capa/${f.id}`)
          if (capaRes.ok) {
            const capa = await capaRes.json()
            setFinding({
              severity: f.severity,
              regulatory_ref: f.regulatory_ref,
              description: f.description,
              root_cause: capa.root_cause,
              corrective_action: capa.corrective_action,
              drafted_by: capa.drafted_by,
            })
          }
        }
      }
    } catch (e) {
      console.log("[v0] /api/detect fallback", (e as Error)?.message)
    }
    setTimeout(() => setPhase("alert"), 2000)
  }

  async function handleApprove() {
    try {
      await fetch(`${API_BASE}/api/capa/2/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "Sarah Chen, QA Director" }),
      })
    } catch (e) {
      console.log("[v0] approve fallback", (e as Error)?.message)
    }
    setApproved(true)
  }

  function handleSendToQA() {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
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
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3.5 text-amber-800">
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
            onClick={() => setShowModal(true)}
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
                  <tr key={b.batch_id} className={`bg-white ${highlight ? "ring-2 ring-inset ring-red-400" : ""}`}>
                    <td className="px-4 py-3 font-medium font-mono text-xs">{b.batch_id}</td>
                    <td className="px-4 py-3 text-slate-700">{b.product}</td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${breach ? "text-critical" : "text-compliant"}`}>
                      {b.temp_reading.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{b.spec_min}–{b.spec_max}°C</td>
                    <td className="px-4 py-3">
                      {b.status === "deviation" ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-critical">Deviation</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-compliant">Compliant</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Finding Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-critical">Critical</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{finding.regulatory_ref}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Evidence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Batch Record — ERP</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Batch ID</span><span className="font-mono font-medium">BCH-2024-0892</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Product</span><span className="font-medium">CardioFlow Valve 3mm</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Temperature</span><span className="font-bold text-critical">28.4°C</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Spec Range</span><span>15–25°C</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Operator</span><span>OP-441</span></div>
                  </div>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">eQMS Status</h3>
                  <div className="flex items-center gap-2 text-critical font-bold text-sm">
                    <X className="h-5 w-5" />
                    No Deviation Report Filed
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Gap detected — AuditAI cross-referenced eQMS and found no filing for this batch</p>
                </div>
              </div>

              {/* CAPA */}
              <div className="rounded-xl border-l-4 border-blue-400 bg-blue-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-900">CAPA Draft — Generated by AuditAI</h3>
                  <span className="text-xs text-blue-600 font-medium">Awaiting approval</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-500">Root Cause</span>
                    <p className="mt-1 text-slate-700">{finding.root_cause}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-500">Corrective Action</span>
                    <p className="mt-1 text-slate-700">{finding.corrective_action}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!approved ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSendToQA}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    📱 Send to QA Manager
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 rounded-lg bg-compliant px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    ✓ Approve CAPA
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
                  <CheckCircle className="h-6 w-6 text-compliant shrink-0" />
                  <div>
                    <div className="font-semibold text-compliant">CAPA Approved</div>
                    <div className="text-xs text-slate-500">Approved by Sarah Chen, QA Director — Audit trail updated</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phone notification */}
          {showNotification && (
            <div className="fixed top-6 right-6 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-right">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-critical text-white font-bold text-sm">AI</div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">AuditAI • now</div>
                  <div className="text-xs font-bold text-slate-800">CAPA Approval Required</div>
                  <div className="text-xs text-slate-500">BCH-2024-0892 — Critical finding awaiting review</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}