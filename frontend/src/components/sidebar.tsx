"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, AlertTriangle, ListChecks, ShieldCheck } from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/findings/1", label: "Findings", icon: AlertTriangle, match: "/findings" },
  { href: "/audit-trail", label: "Audit Trail", icon: ListChecks },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-white hidden md:flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold leading-none">AuditAI</div>
            <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Compliance Intel
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = item.match
              ? pathname.startsWith(item.match)
              : pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="h-2 w-2 rounded-full bg-compliant animate-pulse" />
          2 systems monitored
        </div>
      </div>
    </aside>
  )
}
