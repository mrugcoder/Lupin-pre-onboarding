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

interface JoiningRecord {
  id: number;
  candidate_id: number;
  joining_date: string | null;
  department: string | null;
  designation: string | null;
  reporting_manager: string | null;
  employee_code: string | null;
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function JoiningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateSummary | null>(null);
  const [joining, setJoining] = useState<JoiningRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Form fields
  const [joiningDate, setJoiningDate] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [reportingManager, setReportingManager] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<CandidateSummary>(`/candidates/${id}`),
      api.get<JoiningRecord | null>(`/joining/${id}`).catch(() => ({ data: null })),
    ])
      .then(([cRes, jRes]) => {
        setCandidate(cRes.data);
        const j = jRes.data;
        if (j) {
          setJoining(j);
          setJoiningDate(j.joining_date ?? "");
          setDepartment(j.department ?? "");
          setDesignation(j.designation ?? "");
          setReportingManager(j.reporting_manager ?? "");
          if (j.status === "Joined") setConfirmed(true);
        } else {
          // Pre-fill department from candidate
          setDepartment(cRes.data.department_applied ?? "");
        }
      })
      .catch(() => setError("Failed to load joining data."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirmJoining = async () => {
    if (!joiningDate || !department || !designation || !reportingManager) {
      setError("All fields are required to confirm joining.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<JoiningRecord>(`/joining/${id}`, {
        joining_date: joiningDate,
        department,
        designation,
        reporting_manager: reportingManager,
      });
      setJoining(res.data);
      setConfirmed(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to confirm joining.");
    } finally {
      setSaving(false);
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
        <button onClick={() => router.push("/joining")} className="btn-primary text-sm">← Back</button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-joining"
            onClick={() => router.push("/joining")}
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

      {/* Employee code confirmation banner */}
      {confirmed && joining?.employee_code && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">Joining Confirmed!</span>
          </div>
          <p className="text-xs text-emerald-300/80">Employee code has been generated:</p>
          <p className="font-mono text-2xl font-bold text-emerald-300 tracking-wider mt-1">
            {joining.employee_code}
          </p>
          <p className="text-xs text-emerald-400/70 mt-2">
            Joining date:{" "}
            {joining.joining_date
              ? new Date(joining.joining_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
              : "—"}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Joining form */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Joining Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="j-date">
              Joining Date <span className="text-red-400">*</span>
            </label>
            <input
              id="j-date"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              disabled={confirmed}
              className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="j-dept">
              Department <span className="text-red-400">*</span>
            </label>
            <input
              id="j-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Quality Assurance"
              disabled={confirmed}
              className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="j-desig">
              Designation <span className="text-red-400">*</span>
            </label>
            <input
              id="j-desig"
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. QA Executive"
              disabled={confirmed}
              className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="j-mgr">
              Reporting Manager <span className="text-red-400">*</span>
            </label>
            <input
              id="j-mgr"
              type="text"
              value={reportingManager}
              onChange={(e) => setReportingManager(e.target.value)}
              placeholder="e.g. Mr. Rajesh Kulkarni"
              disabled={confirmed}
              className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {!confirmed && (
          <div className="pt-2">
            <button
              id="btn-confirm-joining"
              onClick={handleConfirmJoining}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Confirming…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Joining &amp; Generate Employee Code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
