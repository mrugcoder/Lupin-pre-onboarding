/**
 * StatusBadge — maps CandidateStatus enum values to coloured pill badges.
 * Consistent with the status enums defined in AGENTS.md.
 */

type StatusValue =
  | "New Application"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Selected"
  | "Joined"
  | "Rejected"
  | "Hold";

const STATUS_STYLES: Record<StatusValue, string> = {
  "New Application":
    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Shortlisted:
    "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  "Interview Scheduled":
    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Selected:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Joined:
    "bg-teal-500/15 text-teal-400 border border-teal-500/30",
  Rejected:
    "bg-red-500/15 text-red-400 border border-red-500/30",
  Hold:
    "bg-slate-500/15 text-slate-400 border border-slate-500/30",
};

export default function StatusBadge({ status }: { status: string }) {
  const classes =
    STATUS_STYLES[status as StatusValue] ??
    "bg-slate-500/15 text-slate-400 border border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${classes}`}
    >
      {status}
    </span>
  );
}
