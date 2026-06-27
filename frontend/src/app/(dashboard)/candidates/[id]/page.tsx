"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DocumentRecord {
  doc_type: string;
  status: string;
  file_path: string | null;
}

interface CandidateDetail {
  id: number;
  candidate_code: string;
  full_name: string;
  dob: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  qualification: string | null;
  university: string | null;
  passing_year: number | null;
  percentage: string | null;
  company_name: string | null;
  years_experience: string | null;
  current_ctc: string | null;
  expected_ctc: string | null;
  department_applied: string | null;
  status: string;
  created_at: string;
  documents: DocumentRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-200 font-medium">{value ?? <span className="text-slate-600 font-normal">—</span>}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-white/8 pb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function DocTypeLabel(type: string): string {
  const map: Record<string, string> = {
    resume: "Resume",
    education_cert: "Education Certificate",
    aadhaar: "Aadhaar Card",
    pan: "PAN Card",
    photo: "Photograph",
    experience_letter: "Experience Letter",
    salary_proof: "Salary Proof",
    bank_details: "Bank Details",
  };
  return map[type] ?? type;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<CandidateDetail>(`/candidates/${id}`)
      .then((res) => setCandidate(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError("Candidate not found.");
        } else {
          setError("Failed to load candidate details. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-7 h-7 text-accent-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-slate-500 text-sm">Loading candidate…</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Candidate not found."}</p>
        <button onClick={() => router.push("/candidates")} className="btn-primary text-sm">
          ← Back to Candidates
        </button>
      </div>
    );
  }

  const formattedDate = new Date(candidate.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedDob = candidate.dob
    ? new Date(candidate.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const formatCtc = (val: string | null) =>
    val ? `₹ ${parseFloat(val).toLocaleString("en-IN")} p.a.` : null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-candidates"
            onClick={() => router.push("/candidates")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
              bg-white/5 hover:bg-white/10 transition-colors duration-150 text-slate-400 hover:text-slate-200"
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
              <span className="text-slate-500 text-xs">Applied {formattedDate}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      {/* Quick-action module links */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Interview", href: `/interviews/${candidate.id}`, color: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" },
          { label: "Documents", href: `/documents/${candidate.id}`, color: "border-accent-500/30 text-accent-400 hover:bg-accent-500/10" },
          { label: "Medical",   href: `/medical/${candidate.id}`,   color: "border-purple-500/30 text-purple-400 hover:bg-purple-500/10" },
          { label: "Joining",   href: `/joining/${candidate.id}`,   color: "border-teal-500/30 text-teal-400 hover:bg-teal-500/10" },
        ].map((link) => (
          <button
            key={link.label}
            id={`btn-goto-${link.label.toLowerCase()}`}
            onClick={() => router.push(link.href)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
              bg-white/3 transition-all duration-200 ${link.color}`}
          >
            {link.label}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Personal Details */}
      <Section
        title="Personal Details"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      >
        <InfoRow label="Full Name" value={candidate.full_name} />
        <InfoRow label="Date of Birth" value={formattedDob} />
        <InfoRow label="Mobile" value={candidate.mobile} />
        <InfoRow label="Email" value={candidate.email} />
        <div className="sm:col-span-2">
          <InfoRow label="Address" value={candidate.address} />
        </div>
      </Section>

      {/* Education */}
      <Section
        title="Education"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        }
      >
        <InfoRow label="Qualification" value={candidate.qualification} />
        <InfoRow label="University / Institution" value={candidate.university} />
        <InfoRow label="Passing Year" value={candidate.passing_year} />
        <InfoRow
          label="Percentage / CGPA"
          value={candidate.percentage ? `${parseFloat(candidate.percentage).toFixed(2)}%` : null}
        />
      </Section>

      {/* Experience */}
      <Section
        title="Work Experience"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      >
        <div className="sm:col-span-2">
          <InfoRow label="Company Name" value={candidate.company_name} />
        </div>
        <InfoRow
          label="Years of Experience"
          value={candidate.years_experience ? `${parseFloat(candidate.years_experience).toFixed(1)} yrs` : null}
        />
        <InfoRow label="Current CTC" value={formatCtc(candidate.current_ctc)} />
        <InfoRow label="Expected CTC" value={formatCtc(candidate.expected_ctc)} />
      </Section>

      {/* Position & Status */}
      <Section
        title="Application"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <InfoRow label="Department Applied" value={candidate.department_applied} />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</span>
          <div className="mt-0.5">
            <StatusBadge status={candidate.status} />
          </div>
        </div>
      </Section>

      {/* Documents */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-accent-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Documents</h2>
        </div>

        {candidate.documents.length === 0 ? (
          <p className="text-slate-600 text-sm">No documents on file.</p>
        ) : (
          <div className="space-y-2">
            {candidate.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-slate-300 font-medium">{DocTypeLabel(doc.doc_type)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      doc.status === "Complete"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {doc.status}
                  </span>
                  {doc.file_path ? (
                    <span className="text-xs text-slate-500 hidden sm:block">On file</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-600 italic">
          Document downloads will be available in the Documents module.
        </p>
      </div>
    </div>
  );
}
