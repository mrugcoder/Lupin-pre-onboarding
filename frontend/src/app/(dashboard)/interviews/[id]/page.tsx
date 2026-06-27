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
  created_at: string;
}

interface InterviewRecord {
  id: number;
  candidate_id: number;
  interview_date: string | null;
  panel: string | null;
  department: string | null;
  remarks: string | null;
}


// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateSummary | null>(null);
  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [interviewDate, setInterviewDate] = useState("");
  const [panel, setPanel] = useState("");
  const [department, setDepartment] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.get<CandidateSummary>(`/candidates/${id}`),
      api.get<InterviewRecord>(`/interviews/${id}`).catch(() => null),
    ])
      .then(([cRes, iRes]) => {
        setCandidate(cRes.data);
        if (iRes) {
          const iv = iRes.data;
          setInterview(iv);
          setInterviewDate(iv.interview_date ?? "");
          setPanel(iv.panel ?? "");
          setDepartment(iv.department ?? "");
          setRemarks(iv.remarks ?? "");
        } else {
          // Pre-fill department from candidate
          setDepartment(cRes.data.department_applied ?? "");
        }
      })
      .catch(() => setError("Failed to load candidate data."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveInterview = async () => {
    if (!interviewDate || !panel) {
      setError("Interview date and panel members are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post<InterviewRecord>(`/interviews/${id}`, {
        interview_date: interviewDate,
        panel,
        department,
        remarks,
      });
      setInterview(res.data);
      // Refresh candidate status
      const cRes = await api.get<CandidateSummary>(`/candidates/${id}`);
      setCandidate(cRes.data);
      setSuccessMsg("Interview scheduled successfully.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to save interview.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.patch<CandidateSummary>(`/candidates/${id}/status`, { status: newStatus });
      setCandidate(res.data);
      setSuccessMsg(`Status updated to "${newStatus}".`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to update status.");
    } finally {
      setStatusSaving(false);
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
        <button onClick={() => router.push("/interviews")} className="btn-primary text-sm">← Back</button>
      </div>
    );
  }

  const canSetOutcome = candidate.status === "Interview Scheduled";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-interviews"
            onClick={() => router.push("/interviews")}
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

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{successMsg}</div>
      )}

      {/* Interview Scheduling Form */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-200">
            {interview ? "Edit Interview Details" : "Schedule Interview"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="iv-date">
              Interview Date <span className="text-red-400">*</span>
            </label>
            <input
              id="iv-date"
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="iv-dept">
              Department
            </label>
            <input
              id="iv-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Quality Assurance"
              className="form-input"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="iv-panel">
              Panel Members <span className="text-red-400">*</span>
            </label>
            <input
              id="iv-panel"
              type="text"
              value={panel}
              onChange={(e) => setPanel(e.target.value)}
              placeholder="e.g. Dr. Sharma, Ms. Desai"
              className="form-input"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide" htmlFor="iv-remarks">
              Remarks
            </label>
            <textarea
              id="iv-remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Notes for the interview panel…"
              className="form-input resize-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            id="btn-save-interview"
            onClick={handleSaveInterview}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {interview ? "Update Interview" : "Schedule Interview"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Action Strip */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Pipeline Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Set the outcome after the interview is complete</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Shortlist action (if still at New Application) */}
          {candidate.status === "New Application" && (
            <button
              id="btn-status-shortlist"
              onClick={() => handleStatusChange("Shortlisted")}
              disabled={statusSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                bg-blue-500/15 border border-blue-500/30 text-blue-300
                hover:bg-blue-500/25 transition-all duration-200 disabled:opacity-50"
            >
              Shortlist
            </button>
          )}

          {/* Outcome buttons — shown when interview is scheduled */}
          {canSetOutcome && (
            <>
              <button
                id="btn-status-selected"
                onClick={() => handleStatusChange("Selected")}
                disabled={statusSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  bg-emerald-500/15 border border-emerald-500/30 text-emerald-300
                  hover:bg-emerald-500/25 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark Selected
              </button>
              <button
                id="btn-status-rejected"
                onClick={() => handleStatusChange("Rejected")}
                disabled={statusSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  bg-red-500/15 border border-red-500/30 text-red-300
                  hover:bg-red-500/25 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
              <button
                id="btn-status-hold"
                onClick={() => handleStatusChange("Hold")}
                disabled={statusSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  bg-amber-500/15 border border-amber-500/30 text-amber-300
                  hover:bg-amber-500/25 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                </svg>
                Put on Hold
              </button>
            </>
          )}

          {(candidate.status === "Selected" || candidate.status === "Rejected" || candidate.status === "Hold") && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              bg-white/5 border border-white/10 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Outcome recorded: <StatusBadge status={candidate.status} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
