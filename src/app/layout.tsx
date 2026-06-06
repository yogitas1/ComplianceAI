import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "AuditAI — Manufacturing Compliance Intelligence",
  description:
    "AuditAI continuously monitors manufacturing batch records, detects compliance deviations, drafts CAPAs, and maintains FDA-ready audit trails.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-slate-100">
      <body className={`${inter.variable} font-sans`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-white min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  )
}
