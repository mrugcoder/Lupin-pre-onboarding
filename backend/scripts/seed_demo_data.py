"""
scripts/seed_demo_data.py
─────────────────────────────────────────────────────────────────────────────
Populate 18 synthetic candidates spread across the full recruitment pipeline.

Run from the backend directory:
  python scripts/seed_demo_data.py

Idempotency: checks for existing LUP-TAR-2026-* codes before inserting.
All PII fields use placeholder patterns (XXXX-XXXX-XXXX) — never real-format PII.

Pipeline distribution:
  3  × New Application
  3  × Shortlisted
  3  × Interview Scheduled  (+ interview records)
  3  × Selected             (+ interview + doc partial + medical partial)
  4  × Selected/Joined      (all docs Complete, medical Fit, joining record)
  1  × Rejected
  1  × Hold
"""

import os
import sys
from datetime import date, datetime

# ── Ensure the backend root is on the path when run directly ──────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.candidate import Candidate, CandidateStatus
from app.models.document import DocType, Document, DocumentStatus
from app.models.interview import Interview
from app.models.joining import JoiningRecord, JoiningStatus
from app.models.medical import MedicalRecord, MedicalStatus

YEAR = 2026
ALL_DOC_TYPES = [e.value for e in DocType]

# ──────────────────────────────────────────────────────────────────────────────
# Seed data definitions
# ──────────────────────────────────────────────────────────────────────────────

CANDIDATES = [
    # ── 3 × New Application ──────────────────────────────────────────────────
    {
        "seq": 1,
        "full_name": "Priya Nair",
        "dob": date(1999, 3, 12),
        "mobile": "9XXXXXXXXX",
        "email": "priya.nair@example.invalid",
        "address": "12, Anand Nagar, Pune, Maharashtra",
        "qualification": "B.Pharm",
        "university": "University of Pune",
        "passing_year": 2022,
        "percentage": 74.5,
        "company_name": None,
        "years_experience": None,
        "current_ctc": None,
        "expected_ctc": 350000,
        "department_applied": "Quality Assurance",
        "status": CandidateStatus.new_application.value,
    },
    {
        "seq": 2,
        "full_name": "Arjun Mehta",
        "dob": date(2000, 7, 25),
        "mobile": "8XXXXXXXXX",
        "email": "arjun.mehta@example.invalid",
        "address": "45, Sector 7, Navi Mumbai, Maharashtra",
        "qualification": "B.Sc Chemistry",
        "university": "Mumbai University",
        "passing_year": 2023,
        "percentage": 68.0,
        "company_name": None,
        "years_experience": None,
        "current_ctc": None,
        "expected_ctc": 300000,
        "department_applied": "R&D",
        "status": CandidateStatus.new_application.value,
    },
    {
        "seq": 3,
        "full_name": "Sneha Patil",
        "dob": date(1998, 11, 5),
        "mobile": "7XXXXXXXXX",
        "email": "sneha.patil@example.invalid",
        "address": "88, Shivaji Road, Nashik, Maharashtra",
        "qualification": "M.Sc Microbiology",
        "university": "Savitribai Phule Pune University",
        "passing_year": 2021,
        "percentage": 82.3,
        "company_name": None,
        "years_experience": None,
        "current_ctc": None,
        "expected_ctc": 420000,
        "department_applied": "Production",
        "status": CandidateStatus.new_application.value,
    },

    # ── 3 × Shortlisted ──────────────────────────────────────────────────────
    {
        "seq": 4,
        "full_name": "Rohan Desai",
        "dob": date(1995, 4, 18),
        "mobile": "9XXXXXXXXX",
        "email": "rohan.desai@example.invalid",
        "address": "22, MG Road, Bengaluru, Karnataka",
        "qualification": "MBA (Supply Chain)",
        "university": "Symbiosis Institute of Management",
        "passing_year": 2019,
        "percentage": 79.1,
        "company_name": "Cipla Ltd",
        "years_experience": 4.5,
        "current_ctc": 650000,
        "expected_ctc": 850000,
        "department_applied": "Supply Chain",
        "status": CandidateStatus.shortlisted.value,
    },
    {
        "seq": 5,
        "full_name": "Kavita Sharma",
        "dob": date(1993, 9, 30),
        "mobile": "8XXXXXXXXX",
        "email": "kavita.sharma@example.invalid",
        "address": "5, Civil Lines, Nagpur, Maharashtra",
        "qualification": "M.Pharm",
        "university": "Nagpur University",
        "passing_year": 2017,
        "percentage": 76.8,
        "company_name": "Sun Pharma",
        "years_experience": 6.0,
        "current_ctc": 780000,
        "expected_ctc": 1000000,
        "department_applied": "Quality Assurance",
        "status": CandidateStatus.shortlisted.value,
    },
    {
        "seq": 6,
        "full_name": "Vikram Singh",
        "dob": date(1997, 1, 14),
        "mobile": "7XXXXXXXXX",
        "email": "vikram.singh@example.invalid",
        "address": "17, Karol Bagh, New Delhi",
        "qualification": "B.Tech Biotechnology",
        "university": "Delhi Technological University",
        "passing_year": 2020,
        "percentage": 71.5,
        "company_name": "Ranbaxy",
        "years_experience": 3.0,
        "current_ctc": 480000,
        "expected_ctc": 650000,
        "department_applied": "R&D",
        "status": CandidateStatus.shortlisted.value,
    },

    # ── 3 × Interview Scheduled ───────────────────────────────────────────────
    {
        "seq": 7,
        "full_name": "Meera Joshi",
        "dob": date(1994, 6, 22),
        "mobile": "9XXXXXXXXX",
        "email": "meera.joshi@example.invalid",
        "address": "33, Baner Road, Pune, Maharashtra",
        "qualification": "B.Pharm, MBA",
        "university": "XLRI Jamshedpur",
        "passing_year": 2018,
        "percentage": 83.0,
        "company_name": "Dr. Reddy's Laboratories",
        "years_experience": 5.5,
        "current_ctc": 900000,
        "expected_ctc": 1200000,
        "department_applied": "Sales",
        "status": CandidateStatus.interview_scheduled.value,
        "interview": {
            "interview_date": date(2026, 7, 5),
            "panel": "Mr. Anil Kapoor, Ms. Prachi Sule",
            "department": "Sales",
            "remarks": "Strong product knowledge. Verify regional experience.",
        },
    },
    {
        "seq": 8,
        "full_name": "Suresh Kumar",
        "dob": date(1992, 12, 3),
        "mobile": "8XXXXXXXXX",
        "email": "suresh.kumar@example.invalid",
        "address": "9, Anna Nagar, Chennai, Tamil Nadu",
        "qualification": "M.Tech Chemical Engineering",
        "university": "IIT Madras",
        "passing_year": 2016,
        "percentage": 88.2,
        "company_name": "Biocon",
        "years_experience": 8.0,
        "current_ctc": 1200000,
        "expected_ctc": 1600000,
        "department_applied": "Production",
        "status": CandidateStatus.interview_scheduled.value,
        "interview": {
            "interview_date": date(2026, 7, 8),
            "panel": "Mr. Rajesh Kulkarni, Dr. Sunita Rao",
            "department": "Production",
            "remarks": "Technical round — GMP compliance focus.",
        },
    },
    {
        "seq": 9,
        "full_name": "Anjali Verma",
        "dob": date(1996, 8, 9),
        "mobile": "7XXXXXXXXX",
        "email": "anjali.verma@example.invalid",
        "address": "67, Salt Lake, Kolkata, West Bengal",
        "qualification": "B.Pharm",
        "university": "Jadavpur University",
        "passing_year": 2019,
        "percentage": 73.4,
        "company_name": "Alkem Laboratories",
        "years_experience": 4.0,
        "current_ctc": 580000,
        "expected_ctc": 750000,
        "department_applied": "Quality Assurance",
        "status": CandidateStatus.interview_scheduled.value,
        "interview": {
            "interview_date": date(2026, 7, 10),
            "panel": "Ms. Deepa Iyer, Mr. Rahul Jain",
            "department": "Quality Assurance",
            "remarks": "Assess experience with USFDA audit preparation.",
        },
    },

    # ── 3 × Selected (docs partial, medical varying) ─────────────────────────
    {
        "seq": 10,
        "full_name": "Amit Choudhary",
        "dob": date(1990, 2, 28),
        "mobile": "9XXXXXXXXX",
        "email": "amit.choudhary@example.invalid",
        "address": "2, Satellite Road, Ahmedabad, Gujarat",
        "qualification": "M.Pharm (Pharmaceutics)",
        "university": "Gujarat University",
        "passing_year": 2014,
        "percentage": 77.9,
        "company_name": "Zydus Cadila",
        "years_experience": 10.0,
        "current_ctc": 1500000,
        "expected_ctc": 2000000,
        "department_applied": "R&D",
        "status": CandidateStatus.selected.value,
        "interview": {
            "interview_date": date(2026, 6, 20),
            "panel": "Dr. Sunita Rao, Mr. Vikrant Bose",
            "department": "R&D",
            "remarks": "Excellent. Selected for R&D lead role.",
        },
        "docs_complete": ["resume", "education_cert", "pan"],
        "medical_status": MedicalStatus.sent_for_medical.value,
    },
    {
        "seq": 11,
        "full_name": "Pooja Bhatt",
        "dob": date(1991, 5, 17),
        "mobile": "8XXXXXXXXX",
        "email": "pooja.bhatt@example.invalid",
        "address": "14, Indiranagar, Bengaluru, Karnataka",
        "qualification": "M.Sc Biochemistry",
        "university": "Bangalore University",
        "passing_year": 2014,
        "percentage": 81.0,
        "company_name": "Sanofi",
        "years_experience": 9.0,
        "current_ctc": 1400000,
        "expected_ctc": 1800000,
        "department_applied": "Supply Chain",
        "status": CandidateStatus.selected.value,
        "interview": {
            "interview_date": date(2026, 6, 15),
            "panel": "Mr. Anil Kapoor, Ms. Reena Shah",
            "department": "Supply Chain",
            "remarks": "Selected. Strong SAP experience.",
        },
        "docs_complete": ["resume", "education_cert", "aadhaar", "pan", "photo"],
        "medical_status": MedicalStatus.report_received.value,
    },
    {
        "seq": 12,
        "full_name": "Rahul Tiwari",
        "dob": date(1988, 10, 11),
        "mobile": "7XXXXXXXXX",
        "email": "rahul.tiwari@example.invalid",
        "address": "55, Civil Lines, Lucknow, UP",
        "qualification": "MBA (Operations)",
        "university": "IIM Lucknow",
        "passing_year": 2012,
        "percentage": 91.5,
        "company_name": "Abbott India",
        "years_experience": 12.0,
        "current_ctc": 2200000,
        "expected_ctc": 2800000,
        "department_applied": "Production",
        "status": CandidateStatus.selected.value,
        "interview": {
            "interview_date": date(2026, 6, 10),
            "panel": "Mr. Rajesh Kulkarni, Mr. Vikrant Bose",
            "department": "Production",
            "remarks": "Senior role. Final approval from VP HR pending.",
        },
        "docs_complete": ["resume", "education_cert"],
        "medical_status": MedicalStatus.sent_for_medical.value,
    },

    # ── 4 × Joined (medical Fit, all docs Complete, employee_code) ────────────
    {
        "seq": 13,
        "full_name": "Nalini Krishnan",
        "dob": date(1987, 4, 2),
        "mobile": "9XXXXXXXXX",
        "email": "nalini.krishnan@example.invalid",
        "address": "78, Adyar, Chennai, Tamil Nadu",
        "qualification": "M.Pharm",
        "university": "Madras University",
        "passing_year": 2010,
        "percentage": 85.0,
        "company_name": "Mankind Pharma",
        "years_experience": 14.0,
        "current_ctc": 2500000,
        "expected_ctc": 3000000,
        "department_applied": "Quality Assurance",
        "status": CandidateStatus.selected.value,
        "docs_complete": ALL_DOC_TYPES,
        "medical_status": MedicalStatus.fit.value,
        "joining": {
            "joining_date": date(2026, 5, 1),
            "department": "Quality Assurance",
            "designation": "Deputy Manager – QA",
            "reporting_manager": "Mr. Rajesh Kulkarni",
            "employee_code": f"LUP-EMP-{YEAR}-001",
        },
    },
    {
        "seq": 14,
        "full_name": "Deepak Pillai",
        "dob": date(1985, 9, 14),
        "mobile": "8XXXXXXXXX",
        "email": "deepak.pillai@example.invalid",
        "address": "5, Panampilly Nagar, Kochi, Kerala",
        "qualification": "B.E. Chemical Engineering",
        "university": "Cochin University",
        "passing_year": 2008,
        "percentage": 78.5,
        "company_name": "Tata Chemicals",
        "years_experience": 16.0,
        "current_ctc": 2800000,
        "expected_ctc": 3400000,
        "department_applied": "Production",
        "status": CandidateStatus.selected.value,
        "docs_complete": ALL_DOC_TYPES,
        "medical_status": MedicalStatus.fit.value,
        "joining": {
            "joining_date": date(2026, 5, 15),
            "department": "Production",
            "designation": "Plant Manager",
            "reporting_manager": "Mr. Vikrant Bose",
            "employee_code": f"LUP-EMP-{YEAR}-002",
        },
    },
    {
        "seq": 15,
        "full_name": "Sunita Agarwal",
        "dob": date(1990, 6, 7),
        "mobile": "7XXXXXXXXX",
        "email": "sunita.agarwal@example.invalid",
        "address": "32, Sector 18, Noida, UP",
        "qualification": "MBA (HR & Finance)",
        "university": "NMIMS Mumbai",
        "passing_year": 2015,
        "percentage": 86.2,
        "company_name": "Glenmark Pharma",
        "years_experience": 9.0,
        "current_ctc": 1600000,
        "expected_ctc": 2100000,
        "department_applied": "Supply Chain",
        "status": CandidateStatus.selected.value,
        "docs_complete": ALL_DOC_TYPES,
        "medical_status": MedicalStatus.fit.value,
        "joining": {
            "joining_date": date(2026, 6, 1),
            "department": "Supply Chain",
            "designation": "Supply Chain Manager",
            "reporting_manager": "Ms. Prachi Sule",
            "employee_code": f"LUP-EMP-{YEAR}-003",
        },
    },
    {
        "seq": 16,
        "full_name": "Kiran Rao",
        "dob": date(1993, 3, 28),
        "mobile": "9XXXXXXXXX",
        "email": "kiran.rao@example.invalid",
        "address": "10, Jubilee Hills, Hyderabad, Telangana",
        "qualification": "M.Sc Pharmacology",
        "university": "University of Hyderabad",
        "passing_year": 2017,
        "percentage": 79.8,
        "company_name": "Hetero Labs",
        "years_experience": 7.0,
        "current_ctc": 1100000,
        "expected_ctc": 1450000,
        "department_applied": "R&D",
        "status": CandidateStatus.selected.value,
        "docs_complete": ALL_DOC_TYPES,
        "medical_status": MedicalStatus.fit.value,
        "joining": {
            "joining_date": date(2026, 6, 10),
            "department": "R&D",
            "designation": "Senior Research Scientist",
            "reporting_manager": "Dr. Sunita Rao",
            "employee_code": f"LUP-EMP-{YEAR}-004",
        },
    },

    # ── 1 × Rejected ─────────────────────────────────────────────────────────
    {
        "seq": 17,
        "full_name": "Manish Gupta",
        "dob": date(1996, 2, 18),
        "mobile": "8XXXXXXXXX",
        "email": "manish.gupta@example.invalid",
        "address": "20, Chandni Chowk, Delhi",
        "qualification": "B.Com",
        "university": "Delhi University",
        "passing_year": 2018,
        "percentage": 55.2,
        "company_name": None,
        "years_experience": None,
        "current_ctc": None,
        "expected_ctc": 280000,
        "department_applied": "Sales",
        "status": CandidateStatus.rejected.value,
        "interview": {
            "interview_date": date(2026, 6, 5),
            "panel": "Ms. Deepa Iyer",
            "department": "Sales",
            "remarks": "Does not meet minimum qualification criteria for pharma sales.",
        },
    },

    # ── 1 × Hold ─────────────────────────────────────────────────────────────
    {
        "seq": 18,
        "full_name": "Ritu Saxena",
        "dob": date(1994, 11, 23),
        "mobile": "7XXXXXXXXX",
        "email": "ritu.saxena@example.invalid",
        "address": "44, Gomti Nagar, Lucknow, UP",
        "qualification": "M.Sc Statistics",
        "university": "Lucknow University",
        "passing_year": 2018,
        "percentage": 80.0,
        "company_name": "Pfizer India",
        "years_experience": 5.5,
        "current_ctc": 820000,
        "expected_ctc": 1100000,
        "department_applied": "R&D",
        "status": CandidateStatus.hold.value,
        "interview": {
            "interview_date": date(2026, 6, 12),
            "panel": "Dr. Sunita Rao, Mr. Rahul Jain",
            "department": "R&D",
            "remarks": "Good profile. On hold pending headcount approval.",
        },
    },
]


# ──────────────────────────────────────────────────────────────────────────────
# Seed function
# ──────────────────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        inserted = 0
        skipped = 0

        for data in CANDIDATES:
            code = f"LUP-TAR-{YEAR}-{data['seq']:03d}"

            # Idempotency check
            existing = db.query(Candidate).filter(Candidate.candidate_code == code).first()
            if existing:
                skipped += 1
                print(f"  SKIP  {code} ({data['full_name']}) — already exists")
                continue

            # Create candidate
            candidate = Candidate(
                candidate_code=code,
                full_name=data["full_name"],
                dob=data.get("dob"),
                mobile=data["mobile"],
                email=data["email"],
                address=data.get("address"),
                qualification=data.get("qualification"),
                university=data.get("university"),
                passing_year=data.get("passing_year"),
                percentage=data.get("percentage"),
                company_name=data.get("company_name"),
                years_experience=data.get("years_experience"),
                current_ctc=data.get("current_ctc"),
                expected_ctc=data.get("expected_ctc"),
                department_applied=data["department_applied"],
                status=data["status"],
            )
            db.add(candidate)
            db.flush()

            # Interview record
            if "interview" in data:
                iv = data["interview"]
                db.add(Interview(
                    candidate_id=candidate.id,
                    interview_date=iv["interview_date"],
                    panel=iv["panel"],
                    department=iv["department"],
                    remarks=iv["remarks"],
                ))

            # Document checklist
            docs_complete = set(data.get("docs_complete", []))
            for dt in ALL_DOC_TYPES:
                doc_status = (
                    DocumentStatus.complete.value if dt in docs_complete
                    else DocumentStatus.pending.value
                )
                db.add(Document(
                    candidate_id=candidate.id,
                    doc_type=dt,
                    status=doc_status,
                    file_path=None,
                ))

            # Medical record
            if "medical_status" in data:
                db.add(MedicalRecord(
                    candidate_id=candidate.id,
                    medical_status=data["medical_status"],
                ))

            # Joining record
            if "joining" in data:
                j = data["joining"]
                db.add(JoiningRecord(
                    candidate_id=candidate.id,
                    joining_date=j["joining_date"],
                    department=j["department"],
                    designation=j["designation"],
                    reporting_manager=j["reporting_manager"],
                    employee_code=j["employee_code"],
                    status=JoiningStatus.joined.value,
                ))

            db.commit()
            inserted += 1
            print(f"  INSERT {code} ({data['full_name']}) — {data['status']}")

        print(f"\nDone. {inserted} inserted, {skipped} skipped.")

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding demo data…\n")
    seed()
