"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_candidates: number;
  totals: Record<string, number>;
  departments: { department: string; count: number }[];
  recent_activity: {
    candidate_code: string;
    full_name: string;
    department_applied: string | null;
    status: string;
    created_at: string;
  }[];
  generated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Funnel config
// ─────────────────────────────────────────────────────────────────────────────

const FUNNEL_STEPS = [
  { key: "New Application",     color: "bg-blue-400",    text: "text-blue-400",    icon: "📥" },
  { key: "Shortlisted",         color: "bg-indigo-400",  text: "text-indigo-400",  icon: "⭐" },
  { key: "Interview Scheduled", color: "bg-amber-400",   text: "text-amber-400",   icon: "📅" },
  { key: "Selected",            color: "bg-emerald-400", text: "text-emerald-400", icon: "✅" },
  { key: "Joined",              color: "bg-teal-400",    text: "text-teal-400",    icon: "🎉" },
  { key: "Hold",                color: "bg-slate-400",   text: "text-slate-400",   icon: "⏸" },
  { key: "Rejected",            color: "bg-red-400",     text: "text-red-400",     icon: "❌" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`glass-card p-5 flex items-center gap-4 border-l-2 ${accent}`}>
      <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100 tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  maxCount,
  color,
  text,
  icon,
}: {
  label: string;
  count: number;
  maxCount: number;
  color: string;
  text: string;
  icon: string;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-base w-5 shrink-0">{icon}</span>
      <div className="w-36 shrink-0">
        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
          {label}
        </span>
      </div>
      <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 text-right shrink-0 ${text}`}>
        {count}
      </span>
    </div>
  );
}

function DeptBar({
  department,
  count,
  max,
}: {
  department: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-40 shrink-0 truncate">{department}</span>
      <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-accent-400 tabular-nums w-5 text-right shrink-0">
        {count}
      </span>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const secs = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardStats>("/dashboard/stats");
      setStats(res.data);
    } catch {
      setError("Failed to load dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8 text-accent-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-slate-500">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-red-400 text-sm">{error ?? "No data available."}</p>
        <button onClick={fetchStats} className="btn-primary text-sm">Retry</button>
      </div>
    );
  }

  const totals = stats.totals;
  const maxFunnelCount = Math.max(...FUNNEL_STEPS.map((s) => totals[s.key] ?? 0), 1);
  const maxDeptCount = Math.max(...stats.departments.map((d) => d.count), 1);

  const activePipeline =
    (totals["New Application"] ?? 0) +
    (totals["Shortlisted"] ?? 0) +
    (totals["Interview Scheduled"] ?? 0) +
    (totals["Selected"] ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Live recruitment pipeline overview
          </p>
        </div>
        <button
          id="btn-refresh-dashboard"
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            text-slate-400 border border-white/10 bg-white/5 hover:bg-white/10
            hover:text-slate-100 transition-all duration-200 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stat cards row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={stats.total_candidates}
          icon="👤"
          accent="border-brand-400"
        />
        <StatCard
          label="Active in Pipeline"
          value={activePipeline}
          icon="🔄"
          accent="border-accent-500"
        />
        <StatCard
          label="Joined"
          value={totals["Joined"] ?? 0}
          icon="🎉"
          accent="border-teal-500"
        />
        <StatCard
          label="Rejected / Hold"
          value={(totals["Rejected"] ?? 0) + (totals["Hold"] ?? 0)}
          icon="📋"
          accent="border-slate-500"
        />
      </div>

      {/* ── Main content grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Funnel — takes 3/5 on large */}
        <div className="lg:col-span-3 glass-card p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Recruitment Funnel</h2>
              <p className="text-xs text-slate-500 mt-0.5">{stats.total_candidates} total candidates</p>
            </div>
          </div>

          <div className="space-y-4">
            {FUNNEL_STEPS.map((step) => (
              <FunnelBar
                key={step.key}
                label={step.key}
                count={totals[step.key] ?? 0}
                maxCount={maxFunnelCount}
                color={step.color}
                text={step.text}
                icon={step.icon}
              />
            ))}
          </div>
        </div>

        {/* Department breakdown — takes 2/5 on large */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-200">By Department</h2>
          </div>

          {stats.departments.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">No department data.</p>
          ) : (
            <div className="space-y-3.5">
              {stats.departments.map((d) => (
                <DeptBar
                  key={d.department}
                  department={d.department}
                  count={d.count}
                  max={maxDeptCount}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity Feed ─────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Recent Applications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last 10 submissions, newest first</p>
          </div>
          <button
            id="btn-view-all-candidates"
            onClick={() => router.push("/candidates")}
            className="ml-auto text-xs text-accent-400 hover:text-accent-300 transition-colors font-medium"
          >
            View all →
          </button>
        </div>

        {stats.recent_activity.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <p className="text-slate-600 text-sm">No applications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recent_activity.map((item) => (
              <div
                key={item.candidate_code}
                id={`activity-${item.candidate_code}`}
                onClick={() => router.push(`/candidates`)}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 cursor-pointer transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {item.full_name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{item.full_name}</span>
                    <span className="font-mono text-accent-400 text-xs hidden sm:block">{item.candidate_code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.department_applied ?? "—"}
                  </p>
                </div>

                {/* Status + time */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-slate-600">{timeAgo(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
