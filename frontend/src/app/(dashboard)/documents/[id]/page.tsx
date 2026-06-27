"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DocumentRecord {
  id: number;
  candidate_id: number;
  doc_type: string;
  status: string;
  file_path: string | null;
}

interface CandidateSummary {
  id: number;
  candidate_code: string;
  full_name: string;
  department_applied: string | null;
  status: string;
}

const DOC_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  photo: "Photograph",
  resume: "Resume / CV",
  education_cert: "Education Certificate",
  experience_letter: "Experience Letter",
  salary_proof: "Salary Proof",
  bank_details: "Bank Details",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateSummary | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null); // doc_type being toggled
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<CandidateSummary>(`/candidates/${id}`),
      api.get<DocumentRecord[]>(`/documents/${id}`),
    ])
      .then(([cRes, dRes]) => {
        setCandidate(cRes.data);
        setDocs(dRes.data);
      })
      .catch(() => setError("Failed to load document checklist."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async (doc: DocumentRecord) => {
    const newStatus = doc.status === "Complete" ? "Pending" : "Complete";
    setToggling(doc.doc_type);
    setError(null);
    try {
      const res = await api.patch<DocumentRecord>(
        `/documents/${id}/${doc.doc_type}`,
        { status: newStatus }
      );
      setDocs((prev) =>
        prev.map((d) => (d.doc_type === doc.doc_type ? res.data : d))
      );
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to update document status.");
    } finally {
      setToggling(null);
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
          <span className="text-slate-500 text-sm">Loading checklist…</span>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Candidate not found."}</p>
        <button onClick={() => router.push("/documents")} className="btn-primary text-sm">← Back</button>
      </div>
    );
  }

  const complete = docs.filter((d) => d.status === "Complete").length;
  const total = docs.length;
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-documents"
            onClick={() => router.push("/documents")}
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

      {/* Progress summary */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Document Completion</span>
          <span className="text-sm font-bold text-slate-100 tabular-nums">{complete}/{total}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              pct === 100 ? "bg-emerald-400" : pct >= 50 ? "bg-accent-400" : "bg-amber-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{pct}% complete</p>
      </div>

      {/* Checklist */}
      <div className="glass-card p-6 space-y-3">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Document Checklist</h2>
        </div>

        <div className="space-y-2 pt-1">
          {docs.map((doc) => {
            const isComplete = doc.status === "Complete";
            const isToggling = toggling === doc.doc_type;
            return (
              <div
                key={doc.doc_type}
                id={`doc-item-${doc.doc_type}`}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 ${
                  isComplete
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : "border-white/8 bg-white/3"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Completion icon */}
                  {isComplete ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-white/15 bg-white/5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-slate-200 font-medium">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                    {doc.file_path && (
                      <p className="text-xs text-slate-500 mt-0.5">File on record</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isComplete
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {doc.status}
                  </span>

                  <button
                    id={`btn-toggle-${doc.doc_type}`}
                    onClick={() => handleToggle(doc)}
                    disabled={isToggling}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-50 ${
                      isComplete
                        ? "border-white/10 text-slate-400 hover:bg-white/5"
                        : "border-accent-500/30 text-accent-400 hover:bg-accent-500/10"
                    }`}
                  >
                    {isToggling ? "…" : isComplete ? "Mark Pending" : "Mark Complete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
