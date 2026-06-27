# AGENTS.md — Lupin Pre-Onboarding Connect

## What this project is
A Pre-Onboarding & Recruitment Automation Portal for an HR department at a pharma company.
It covers the gap BEFORE an employee exists in the company's main HRIS (Employee Connect):
Recruitment → Document Verification → Medical Tracking → Joining.

This is a college/internship PROTOTYPE, not a production system. It will never connect to
any real company system. All demo/seed data must be synthetic — see Data Rules below.

## Stack (do not deviate without asking)
- Frontend: React + Next.js 14 (App Router), TypeScript, TailwindCSS
- Backend: FastAPI (Python 3.11+), SQLAlchemy ORM
- Database: PostgreSQL for the real build, SQLite is acceptable for local/demo mode
- Auth: JWT session tokens, bcrypt password hashing, role-based access control
- File storage: local `/uploads` directory (resumes, certificates, ID docs), never web-root-exposed
- Email: do NOT integrate a real email provider. Log "email sent" events to console/DB instead.

## Core data model
- `users` (HR admins): id, name, email, password_hash, role
- `candidates`: id, candidate_code (see ID format below), full_name, dob, mobile, email, address,
  qualification, university, passing_year, percentage, company_name, years_experience,
  current_ctc, expected_ctc, department_applied, status, created_at
- `interviews`: candidate_id, interview_date, panel, department, remarks
- `documents`: candidate_id, doc_type (aadhaar/pan/photo/resume/education_cert/experience_letter/
  salary_proof/bank_details), status (pending/complete), file_path
- `medical_records`: candidate_id, medical_status
- `joining_records`: candidate_id, joining_date, department, designation, reporting_manager,
  employee_code (generated only after status = Joined)

## Status enums (use these exact values — do not invent new ones)
- candidate.status: New Application, Shortlisted, Interview Scheduled, Selected, Rejected, Hold
- documents.status: Pending, Complete
- medical_records.medical_status: Sent for medical, Report received, Fit, Not Fit
- joining_records: Pending, Joined

## Candidate ID format
`LUP-TAR-{YEAR}-{SEQ}` where SEQ is a zero-padded 3-digit number that resets each year.
Example: LUP-TAR-2026-001, LUP-TAR-2026-002.
Generate this server-side, inside a transaction, never on the frontend.

## Security rules (non-negotiable — flag and stop if a task conflicts with these)
1. Passwords are always bcrypt-hashed. Never log, store, or return plaintext passwords.
2. Every dashboard and API route (except the public candidate registration form and login)
   requires a valid JWT and HR role check.
3. All file uploads are validated server-side for MIME type and size (max 5MB) before saving.
4. All form inputs are validated and sanitized server-side, not just client-side.
5. No route should ever return another candidate's full PII in a list/summary view —
   list views show name + status + ID only; full PII (Aadhaar, PAN, bank details) is only
   visible on the single-candidate detail view, to an authenticated HR user.

## Data rules
- Seed/demo data must use obviously fake values: Aadhaar/PAN/bank fields use placeholder
  patterns like XXXX-XXXX-XXXX, fake names, fake numbers. Never generate realistic-looking
  real-format PII, even for testing.
- This system never connects to Lupin's actual Employee Connect or any live company system.
  The "Employee Connect Integration" module is a conceptual diagram/screen only.

## Build order (respect this — don't jump ahead)
1. Database schema + migrations
2. Auth (HR login, JWT, protected route middleware) + base app shell/navigation
3. Candidate registration form + auto ID generation
4. Interview management, document checklist, medical tracker, joining tracker
5. Dashboard aggregation (counts/funnel)
6. Excel/PDF export

## Coding conventions
- Backend: snake_case for Python, Pydantic models for request/response schemas
- Frontend: PascalCase components, one component per file, Tailwind utility classes only
- Every new API route gets a corresponding test stub, even if minimal
