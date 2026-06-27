"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface MedicalListItem {
  id: number;
  candidate_code: string;
  full_name: string;
  department_applied: string | null;
  status: string;
  medical_status: string | null;
}

const MEDICAL_BADGE: Record<string, string> = {
  "Sent for medical": "bg-blue-500/15 text-blue-400",
  "Report received": "bg-purple-500/15 text-purple-300",
  "Fit": "bg-emerald-500/15 text-emerald-400",
  "Not Fit": "bg-red-500/15 text-red-400",
};

export default function MedicalPage() {
  const router = useRouter();
  const [items, setItems] = useState<MedicalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedical = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<MedicalListItem[]>("/medical");
      setItems(res.data);
    } catch {
      setError("Failed to load medical tracker. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedical(); }, [fetchMedical]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Medical Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Loading…" : `${items.length} selected candidate${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          id="btn-refresh-medical"
          onClick={fetchMedical}
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

      {/* Info callout */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-sm text-blue-300 flex items-start gap-2.5">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Only candidates with status <strong className="mx-1">Selected</strong> appear here. Advance medical status step-by-step from within each candidate.
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No selected candidates yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Application ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Medical Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    id={`medical-row-${item.id}`}
                    onClick={() => router.push(`/medical/${item.id}`)}
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
                      {item.medical_status ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MEDICAL_BADGE[item.medical_status] ?? "bg-white/10 text-slate-400"}`}>
                          {item.medical_status}
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-slate-500">Not started</span>
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
