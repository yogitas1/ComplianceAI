"use client"

import { useState } from "react"
import { Bot, User, Zap, FileDown, Check, Loader2 } from "lucide-react"
import type { AuditEvent } from "@/lib/data"

export function AuditTrailClient({ events }: { events: AuditEvent[] }) {
  const [toast, setToast] = useState<"hidden" | "preparing" | "ready">("hidden")

  // newest first
  const ordered = [...events].sort((a, b) => b.step - a.step)
  const total = ordered.length

  function exportReport() {
    setToast("preparing")
    setTimeout(() => setToast("ready"), 2000)
    setTimeout(() => setToast("hidden"), 6000)
  }

  function relativeTime(step: number) {
    // step 1 is oldest (6 min ago), highest step is newest (just now-ish)
    const minsAgo = total - step + 1
    return `${minsAgo} min ago`
  }

  return (
    <div className="px-8 py-7 max-w-4xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-compliant">
            Complete
          </span>
        </div>
        <button
          onClick={exportReport}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FileDown className="h-4 w-4" />
          Export Audit Report
        </button>
      </header>

      {/* Stat banner */}
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5">
        <Zap className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">
          6 minutes from detection to resolution
        </span>
      </div>

      {/* Timeline */}
      <ol className="mt-7 relative">
        {ordered.map((e, idx) => {
          const isHuman = e.type === "human"
          const highlight = isHuman
          return (
            <li key={e.step} className="relative flex gap-4 pb-6 last:pb-0">
              {/* line */}
              {idx < ordered.length - 1 && (
                <span className="absolute left-[18px] top-9 h-full w-px bg-slate-200" />
              )}
              {/* icon */}
              <span
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isHuman ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                {isHuman ? (
                  <User className="h-[18px] w-[18px] text-compliant" />
                ) : (
                  <Bot className="h-[18px] w-[18px] text-blue-600" />
                )}
              </span>

              <div
                className={`flex-1 rounded-xl border p-4 ${
                  highlight
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{relativeTime(e.step)}</span>
                  {isHuman ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-compliant">
                      Human
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                      AuditAI
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-800">{e.description}</p>
                <p className="mt-1 text-xs text-slate-500">{e.actor}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Toast */}
      {toast !== "hidden" && (
        <div className="toast-in fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
          {toast === "preparing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Preparing FDA-ready PDF export...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-compliant" />
              <span className="text-sm font-medium">
                Export ready — BCH-2024-0892-audit-report.pdf
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
