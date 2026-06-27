"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Manufacturing",
  "Quality Assurance",
  "Research & Development",
  "Sales & Marketing",
  "Human Resources",
  "Finance & Accounts",
  "Information Technology",
  "Regulatory Affairs",
  "Logistics & Supply Chain",
];

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  full_name: string;
  dob: string;
  mobile: string;
  email: string;
  address: string;
  qualification: string;
  university: string;
  passing_year: string;
  percentage: string;
  company_name: string;
  years_experience: string;
  current_ctc: string;
  expected_ctc: string;
  department_applied: string;
}

interface Confirmation {
  candidate_code: string;
  full_name: string;
  department_applied: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: file validation
// ─────────────────────────────────────────────────────────────────────────────

function validateFile(file: File, label: string): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${label}: only PDF, JPEG, and PNG files are accepted.`;
  }
  if (file.size > MAX_BYTES) {
    return `${label}: file size must not exceed 5 MB (current: ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-500/20 border border-accent-500/30 shrink-0">
        <span className="text-accent-400 font-bold text-sm">{step}</span>
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-accent-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation Screen
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmationScreen({ data }: { data: Confirmation }) {
  const date = new Date(data.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center space-y-6 animate-fade-in">
        {/* Success icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-100">Application Submitted!</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Thank you, <span className="text-slate-200 font-medium">{data.full_name}</span>.
            Your application for <span className="text-slate-200 font-medium">{data.department_applied}</span> has been received.
          </p>
        </div>

        {/* Application ID card */}
        <div className="glass-card p-6 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Your Application ID</p>
          <p
            id="confirmation-code"
            className="text-3xl font-mono font-bold text-accent-400 tracking-wide select-all"
          >
            {data.candidate_code}
          </p>
          <p className="text-xs text-slate-500">Applied on {date}</p>
        </div>

        <div className="glass-card p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold">Important — save your Application ID</span>
          </div>
          <p className="text-xs text-slate-400">
            Please note down or screenshot your Application ID. You will need it to track
            your application status. Our HR team will reach out to you on the contact
            details provided.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Return to home
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Registration Page
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    dob: "",
    mobile: "",
    email: "",
    address: "",
    qualification: "",
    university: "",
    passing_year: "",
    percentage: "",
    company_name: "",
    years_experience: "",
    current_ctc: "",
    expected_ctc: "",
    department_applied: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "resume" | "education_cert" | "form", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Confirmation | null>(null);

  const resumeRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>, field: "resume" | "education_cert") {
    const file = e.target.files?.[0] ?? null;
    if (field === "resume") setResumeFile(file);
    else setCertFile(file);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!form.full_name.trim()) newErrors.full_name = "Full name is required.";
    if (!form.mobile.trim()) newErrors.mobile = "Mobile number is required.";
    if (!/^\+?\d[\d\s\-]{6,18}$/.test(form.mobile)) newErrors.mobile = "Enter a valid mobile number.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email address.";
    if (!form.qualification.trim()) newErrors.qualification = "Qualification is required.";
    if (!form.university.trim()) newErrors.university = "University is required.";
    if (!form.passing_year) newErrors.passing_year = "Passing year is required.";
    if (!form.percentage) newErrors.percentage = "Percentage is required.";
    else if (parseFloat(form.percentage) < 0 || parseFloat(form.percentage) > 100)
      newErrors.percentage = "Percentage must be between 0 and 100.";
    if (!form.department_applied) newErrors.department_applied = "Please select a department.";

    if (!resumeFile) {
      newErrors.resume = "Resume is required.";
    } else {
      const err = validateFile(resumeFile, "Resume");
      if (err) newErrors.resume = err;
    }

    if (certFile) {
      const err = validateFile(certFile, "Education certificate");
      if (err) newErrors.education_cert = err;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const fd = new FormData();
      // Text fields
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      fd.append("resume", resumeFile!);
      if (certFile) fd.append("education_cert", certFile);

      const resp = await axios.post("/api/candidates/register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setConfirmed(resp.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          setErrors({ form: detail });
        } else if (Array.isArray(detail)) {
          const mapped: typeof errors = {};
          detail.forEach((d: { loc: string[]; msg: string }) => {
            const field = d.loc[d.loc.length - 1] as keyof typeof errors;
            mapped[field] = d.msg;
          });
          setErrors(mapped);
        } else {
          setErrors({ form: "Submission failed. Please try again." });
        }
      } else {
        setErrors({ form: "An unexpected error occurred." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render confirmation ────────────────────────────────────────────────────

  if (confirmed) return <ConfirmationScreen data={confirmed} />;

  // ── Render form ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-950">
      {/* Header */}
      <header className="border-b border-white/8 bg-brand-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-accent shadow-glow-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Lupin Pharmaceuticals</p>
              <p className="text-xs text-slate-500 leading-tight">Candidate Application Portal</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">Confidential — for recruitment use only</span>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Job Application</h1>
          <p className="text-slate-400 text-sm mt-1">
            Fill in the form below to apply. Fields marked <span className="text-accent-400">*</span> are required.
            You will receive an Application ID upon submission.
          </p>
        </div>

        {errors.form && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {errors.form}
          </div>
        )}

        <form id="candidate-registration-form" onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ── Section 1: Personal Details ─────────────────────────────── */}
          <section className="glass-card p-6">
            <SectionHeader step={1} title="Personal Details" subtitle="Your basic contact information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full Name" required error={errors.full_name}>
                  <input
                    id="field-full-name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="As on official documents"
                    value={form.full_name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </Field>
              </div>

              <Field label="Date of Birth" error={errors.dob}>
                <input
                  id="field-dob"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  className="input-field"
                  style={{ colorScheme: "dark" }}
                />
              </Field>

              <Field label="Mobile Number" required error={errors.mobile}>
                <input
                  id="field-mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={form.mobile}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <Field label="Email Address" required error={errors.email}>
                <input
                  id="field-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Address" error={errors.address}>
                  <textarea
                    id="field-address"
                    name="address"
                    rows={2}
                    placeholder="Current residential address"
                    value={form.address}
                    onChange={handleChange}
                    className="input-field resize-none"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ── Section 2: Education ────────────────────────────────────── */}
          <section className="glass-card p-6">
            <SectionHeader step={2} title="Education" subtitle="Your highest qualification details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Qualification" required error={errors.qualification}>
                <input
                  id="field-qualification"
                  name="qualification"
                  type="text"
                  placeholder="e.g. B.Pharm, M.Sc, MBA"
                  value={form.qualification}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <Field label="University / Institution" required error={errors.university}>
                <input
                  id="field-university"
                  name="university"
                  type="text"
                  placeholder="e.g. University of Mumbai"
                  value={form.university}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <Field label="Passing Year" required error={errors.passing_year}>
                <input
                  id="field-passing-year"
                  name="passing_year"
                  type="number"
                  min={1980}
                  max={2030}
                  placeholder="2022"
                  value={form.passing_year}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <Field label="Percentage / CGPA (%)" required error={errors.percentage}>
                <input
                  id="field-percentage"
                  name="percentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="75.50"
                  value={form.percentage}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>
            </div>
          </section>

          {/* ── Section 3: Experience ───────────────────────────────────── */}
          <section className="glass-card p-6">
            <SectionHeader
              step={3}
              title="Work Experience"
              subtitle="Leave blank if you are a fresher — all fields in this section are optional"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Current / Last Company" error={errors.company_name}>
                  <input
                    id="field-company-name"
                    name="company_name"
                    type="text"
                    placeholder="Company name (if applicable)"
                    value={form.company_name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </Field>
              </div>

              <Field label="Years of Experience" error={errors.years_experience}>
                <input
                  id="field-years-experience"
                  name="years_experience"
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  placeholder="3.5"
                  value={form.years_experience}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <Field label="Current CTC (₹ per annum)" error={errors.current_ctc}>
                <input
                  id="field-current-ctc"
                  name="current_ctc"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="450000"
                  value={form.current_ctc}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>

              <Field label="Expected CTC (₹ per annum)" error={errors.expected_ctc}>
                <input
                  id="field-expected-ctc"
                  name="expected_ctc"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="600000"
                  value={form.expected_ctc}
                  onChange={handleChange}
                  className="input-field"
                />
              </Field>
            </div>
          </section>

          {/* ── Section 4: Department ───────────────────────────────────── */}
          <section className="glass-card p-6">
            <SectionHeader step={4} title="Department Applying For" subtitle="Select the department you are applying to" />
            <Field label="Department" required error={errors.department_applied}>
              <select
                id="field-department"
                name="department_applied"
                value={form.department_applied}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">— Select a department —</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
          </section>

          {/* ── Section 5: Documents ────────────────────────────────────── */}
          <section className="glass-card p-6">
            <SectionHeader step={5} title="Documents" subtitle="PDF, JPEG or PNG only — maximum 5 MB per file" />
            <div className="space-y-4">
              {/* Resume */}
              <Field label="Resume" required error={errors.resume}>
                <div
                  onClick={() => resumeRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                    px-6 py-6 cursor-pointer transition-all duration-200
                    ${resumeFile
                      ? "border-accent-500/50 bg-accent-500/5"
                      : "border-white/15 bg-white/3 hover:border-accent-500/40 hover:bg-white/5"
                    }
                    ${errors.resume ? "border-red-500/50" : ""}
                  `}
                >
                  <input
                    ref={resumeRef}
                    id="field-resume"
                    name="resume"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "resume")}
                  />
                  {resumeFile ? (
                    <>
                      <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-slate-200 font-medium">{resumeFile.name}</p>
                      <p className="text-xs text-slate-500">{(resumeFile.size / 1024).toFixed(0)} KB — click to change</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-slate-400">Click to upload your resume</p>
                      <p className="text-xs text-slate-600">PDF, JPEG, PNG · max 5 MB</p>
                    </>
                  )}
                </div>
              </Field>

              {/* Education Certificate */}
              <Field label="Education Certificate (optional)" error={errors.education_cert}>
                <div
                  onClick={() => certRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                    px-6 py-6 cursor-pointer transition-all duration-200
                    ${certFile
                      ? "border-accent-500/50 bg-accent-500/5"
                      : "border-white/15 bg-white/3 hover:border-accent-500/40 hover:bg-white/5"
                    }
                    ${errors.education_cert ? "border-red-500/50" : ""}
                  `}
                >
                  <input
                    ref={certRef}
                    id="field-education-cert"
                    name="education_cert"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "education_cert")}
                  />
                  {certFile ? (
                    <>
                      <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-slate-200 font-medium">{certFile.name}</p>
                      <p className="text-xs text-slate-500">{(certFile.size / 1024).toFixed(0)} KB — click to change</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-slate-400">Click to upload education certificate</p>
                      <p className="text-xs text-slate-600">PDF, JPEG, PNG · max 5 MB · optional</p>
                    </>
                  )}
                </div>
              </Field>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-10">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              By submitting, you confirm that all information provided is accurate to the best of your knowledge.
            </p>
            <button
              id="btn-submit-registration"
              type="submit"
              disabled={submitting}
              className="btn-primary min-w-[180px]"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
