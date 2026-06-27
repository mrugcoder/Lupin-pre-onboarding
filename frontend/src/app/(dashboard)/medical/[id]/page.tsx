"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CandidateSummary {
  id: number;
  candidate_code: string;
  full_name: string;
  department_applied: string | null;
  status: string;
}

interface MedicalRecord {
  id: number;
  candidate_id: number;
  medical_status: string;
}

// Ordered pipeline steps
const MEDICAL_STEPS = [
  "Sent for medical",
  "Report received",
  "Fit",
  "Not Fit",
];

const STEP_COLORS: Record<string, string> = {
  "Sent for medical": "bg-blue-500/15 border-blue-500/30 text-blue-300",
  "Report received": "bg-purple-500/15 border-purple-500/30 text-purple-300",
  "Fit": "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  "Not Fit": "bg-red-500/15 border-red-500/30 text-red-300",
};

const STEP_ACTIVE: Record<string, string> = {
  "Sent for medical": "bg-blue-500/25 border-blue-400 text-blue-200",
  "Report received": "bg-purple-500/25 border-purple-400 text-purple-200",
  "Fit": "bg-emerald-500/25 border-emerald-400 text-emerald-200",
  "Not Fit": "bg-red-500/25 border-red-400 text-red-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MedicalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateSummary | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<CandidateSummary>(`/candidates/${id}`),
      api.get<MedicalRecord>(`/medical/${id}`),
    ])
      .then(([cRes, mRes]) => {
        setCandidate(cRes.data);
        setRecord(mRes.data);
      })
      .catch(() => setError("Failed to load medical record."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSetStatus = async (newStatus: string) => {
    setUpdating(newStatus);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.patch<MedicalRecord>(`/medical/${id}`, { medical_status: newStatus });
      setRecord(res.data);
      setSuccessMsg(`Medical status updated to "${newStatus}".`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to update medical status.");
    } finally {
      setUpdating(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-7 h-7 text-accent-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-slate-500 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Candidate not found."}</p>
        <button onClick={() => router.push("/medical")} className="btn-primary text-sm">← Back</button>
      </div>
    );
  }

  const currentStatus = record?.medical_status ?? null;
  const currentIdx = currentStatus ? MEDICAL_STEPS.indexOf(currentStatus) : -1;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-medical"
            onClick={() => router.push("/medical")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
              bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{candidate.full_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-accent-400 text-xs font-semibold">{candidate.candidate_code}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500 text-xs">{candidate.department_applied ?? "—"}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{successMsg}</div>
      )}

      {/* Current status banner */}
      {currentStatus && (
        <div className={`rounded-xl border px-4 py-4 flex items-center gap-3 ${STEP_COLORS[currentStatus]}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">Current Medical Status</p>
            <p className="text-base font-semibold">{currentStatus}</p>
          </div>
        </div>
      )}

      {/* Step buttons */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Advance Medical Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click a step to update. Steps advance sequentially.</p>
          </div>
        </div>

        {/* Visual pipeline */}
        <div className="flex flex-col gap-3">
          {MEDICAL_STEPS.map((step, idx) => {
            const isCurrent = step === currentStatus;
            const isPast = currentIdx !== -1 && idx < currentIdx && step !== "Not Fit";

            return (
              <button
                key={step}
                id={`btn-medical-${step.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => handleSetStatus(step)}
                disabled={!!updating || isCurrent}
                className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left
                  transition-all duration-200 disabled:cursor-default group
                  ${isCurrent
                    ? STEP_ACTIVE[step]
                    : isPast
                      ? "border-white/10 bg-white/5 text-slate-600 opacity-60"
                      : `${STEP_COLORS[step]} hover:opacity-90`
                  }`}
              >
                {/* Step number/check */}
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                  isCurrent ? "border-current bg-current/20" : isPast ? "border-slate-600 bg-slate-800" : "border-current bg-current/10"
                }`}>
                  {isPast ? (
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="opacity-70">{idx + 1}</span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold">{step}</p>
                  {isCurrent && <p className="text-xs opacity-60 mt-0.5">Current status</p>}
                </div>

                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                )}
                {updating === step && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {(currentStatus === "Fit") && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Candidate is medically fit. Proceed to the <strong className="ml-1">Joining</strong> module to confirm joining.
          </div>
        )}
      </div>
    </div>
  );
}
