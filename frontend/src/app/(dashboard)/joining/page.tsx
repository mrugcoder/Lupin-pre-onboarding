"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface JoiningListItem {
  id: number;
  candidate_code: string;
  full_name: string;
  department_applied: string | null;
  status: string;
  medical_status: string | null;
  joining_date: string | null;
  employee_code: string | null;
  joining_status: string | null;
}

export default function JoiningPage() {
  const router = useRouter();
  const [items, setItems] = useState<JoiningListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoining = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<JoiningListItem[]>("/joining");
      setItems(res.data);
    } catch {
      setError("Failed to load joining tracker. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJoining(); }, [fetchJoining]);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Joining Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Loading…" : `${items.length} candidate${items.length !== 1 ? "s" : ""} cleared for joining`}
          </p>
        </div>
        <button
          id="btn-refresh-joining"
          onClick={fetchJoining}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            text-slate-400 border border-white/10 bg-white/5 hover:bg-white/10
            hover:text-slate-100 transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
        >
          <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-300 flex items-start gap-2.5">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Only candidates with <strong className="mx-1">medical_status = Fit</strong> appear here. Fill the joining form to generate an employee code.
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No candidates cleared for joining yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Application ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joining Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Employee Code</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joining Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    id={`joining-row-${item.id}`}
                    onClick={() => router.push(`/joining/${item.id}`)}
                    className="hover:bg-white/5 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-accent-400 text-xs font-semibold tracking-wide">{item.candidate_code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-200 font-medium">{item.full_name}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-slate-400">{item.department_applied ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      {item.joining_date ? (
                        <span className="text-slate-300 text-xs font-medium">{formatDate(item.joining_date)}</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {item.employee_code ? (
                        <span className="font-mono text-emerald-400 text-xs font-semibold">{item.employee_code}</span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {item.joining_status === "Joined" ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">Joined</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-accent-400 transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
