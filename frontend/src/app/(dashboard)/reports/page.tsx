"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_candidates: number;
  totals: Record<string, number>;
  departments: { department: string; count: number }[];
  generated_at: string;
}

type Tab = "export" | "connect";

// ─────────────────────────────────────────────────────────────────────────────
// Status funnel order (for preview table)
// ─────────────────────────────────────────────────────────────────────────────

const FUNNEL_ORDER = [
  "New Application",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Joined",
  "Hold",
  "Rejected",
];

// ─────────────────────────────────────────────────────────────────────────────
// Export Tab
// ─────────────────────────────────────────────────────────────────────────────

function ExportTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => setError("Failed to load stats preview."))
      .finally(() => setLoadingStats(false));
  }, []);

  const handleDownload = async (format: "excel" | "pdf") => {
    setDownloading(format);
    setError(null);
    try {
      const endpoint =
        format === "excel" ? "/reports/export/excel" : "/reports/export/pdf";
      const mimeType =
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      const ext = format === "excel" ? "xlsx" : "pdf";

      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${endpoint}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `lupin_report_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Failed to download ${format.toUpperCase()} export. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  const totals = stats?.totals ?? {};
  const total = stats?.total_candidates ?? 0;

  return (
    <div className="space-y-6">
      {/* Download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Excel card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Candidate List</h3>
              <p className="text-xs text-slate-500">.xlsx spreadsheet</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full candidate list with Application ID, Name, Department, Status, Qualification, Experience, Expected CTC, and Date Applied.
          </p>
          <button
            id="btn-export-excel"
            onClick={() => handleDownload("excel")}
            disabled={!!downloading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              bg-emerald-500/15 border border-emerald-500/30 text-emerald-300
              hover:bg-emerald-500/25 transition-all duration-200 disabled:opacity-50"
          >
            {downloading === "excel" ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Excel
              </>
            )}
          </button>
        </div>

        {/* PDF card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Pipeline Summary</h3>
              <p className="text-xs text-slate-500">.pdf report</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Formatted A4 PDF with funnel breakdown, department summary, and a list of confirmed joinings. Ready to share in HR review meetings.
          </p>
          <button
            id="btn-export-pdf"
            onClick={() => handleDownload("pdf")}
            disabled={!!downloading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              bg-red-500/15 border border-red-500/30 text-red-300
              hover:bg-red-500/25 transition-all duration-200 disabled:opacity-50"
          >
            {downloading === "pdf" ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Live stats preview */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Live Snapshot</h3>
            <p className="text-xs text-slate-500 mt-0.5">This is what the export will contain</p>
          </div>
        </div>

        {loadingStats ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Count</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {FUNNEL_ORDER.map((status) => {
                  const cnt = totals[status] ?? 0;
                  const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={status} className="hover:bg-white/3 transition-colors">
                      <td className="py-2.5 text-slate-300">{status}</td>
                      <td className="py-2.5 text-right font-mono text-slate-200 font-semibold">{cnt}</td>
                      <td className="py-2.5 text-right text-slate-500">{pct}%</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-white/15">
                  <td className="py-2.5 text-slate-200 font-semibold">Total</td>
                  <td className="py-2.5 text-right font-mono text-accent-400 font-bold">{total}</td>
                  <td className="py-2.5 text-right text-slate-400">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Connect Tab
// ─────────────────────────────────────────────────────────────────────────────

const TRANSFER_FIELDS = [
  { field: "employee_code",     label: "Employee Code",    example: "LUP-EMP-2026-001", note: "Auto-generated on joining confirmation" },
  { field: "full_name",         label: "Full Name",        example: "Nalini Krishnan",   note: "From candidate profile" },
  { field: "department",        label: "Department",       example: "Quality Assurance",  note: "As confirmed in joining record" },
  { field: "designation",       label: "Designation",      example: "Deputy Manager – QA", note: "Entered at joining step" },
  { field: "joining_date",      label: "Date of Joining",  example: "01 May 2026",       note: "Confirmed joining date" },
  { field: "reporting_manager", label: "Reporting Manager", example: "Mr. Rajesh Kulkarni", note: "As entered in joining record" },
];

function ConnectTab() {
  return (
    <div className="space-y-6">
      {/* Conceptual disclaimer banner */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-300">CONCEPTUAL — Not connected to any live system</p>
          <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
            This screen is a roadmap concept only. Lupin Pre-Onboarding Connect is a prototype and does
            not integrate with, communicate with, or access any Lupin Employee Connect or HRIS system.
            No real data is transmitted anywhere.
          </p>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Conceptual Integration Flow</h2>
            <p className="text-xs text-slate-500 mt-0.5">How a Joined candidate&apos;s record would hand off to HRIS</p>
          </div>
        </div>

        {/* Visual flow */}
        <div className="flex flex-col sm:flex-row items-center gap-3 py-4">
          {/* Box 1 */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-accent-500/30 bg-accent-500/8 min-w-[160px] text-center">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-accent-300">Candidate</p>
            <p className="text-xs text-slate-500 leading-tight">Joins after medical clearance</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-1 sm:flex-col sm:gap-1 text-slate-600 text-xs font-medium">
            <svg className="w-6 h-6 rotate-0 sm:rotate-90 text-accent-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="text-accent-500/60">Joining confirmed</span>
          </div>

          {/* Box 2 */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-accent-500/50 bg-accent-500/12 min-w-[180px] text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-accent">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-xs font-bold text-accent-300">Lupin Pre-Onboarding</p>
            <p className="text-xs text-slate-400 leading-tight">Generates employee_code, packages record</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-1 sm:flex-col sm:gap-1 text-slate-600 text-xs font-medium">
            <svg className="w-6 h-6 rotate-0 sm:rotate-90 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="text-amber-500/60 text-center">API handoff<br/>(conceptual)</span>
          </div>

          {/* Box 3 */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-500/30 bg-slate-500/8 min-w-[160px] text-center relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium whitespace-nowrap">
              concept only
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center mt-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-300">Lupin HRIS</p>
            <p className="text-xs text-slate-500 leading-tight">Employee Connect system</p>
          </div>
        </div>
      </div>

      {/* Fields that would transfer */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Fields That Would Transfer</h2>
            <p className="text-xs text-slate-500 mt-0.5">Example: Nalini Krishnan — LUP-EMP-2026-001</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Field</th>
                <th className="text-left py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Example Value</th>
                <th className="text-left py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {TRANSFER_FIELDS.map((f) => (
                <tr key={f.field} className="hover:bg-white/3 transition-colors">
                  <td className="py-3">
                    <code className="text-xs font-mono text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded">
                      {f.field}
                    </code>
                  </td>
                  <td className="py-3 text-slate-200 text-sm">{f.example}</td>
                  <td className="py-3 text-slate-500 text-xs hidden md:table-cell">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-600 italic border-t border-white/5 pt-4">
          In a production implementation, this handoff would use a secure internal API
          (mTLS or service-account token) after the HR manager clicks &quot;Finalize and
          sync to HRIS&quot;. That button and integration are outside the scope of this
          prototype.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("export");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "export",
      label: "Export Reports",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
    {
      key: "connect",
      label: "Employee Connect",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Export data and explore system integrations</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-accent-500/20 text-accent-300 border border-accent-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "export" ? <ExportTab /> : <ConnectTab />}
    </div>
  );
}
