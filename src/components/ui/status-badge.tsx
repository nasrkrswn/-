import { cn } from "@/components/ui/cn";
import { attendanceStatusLabels, requestStatusLabels } from "@/lib/labels";
import type { AttendanceStatus, RequestStatus } from "@/lib/types";

const attendanceStyles: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  late: "bg-amber-50 text-amber-700 ring-amber-200",
  absent: "bg-rose-50 text-rose-700 ring-rose-200",
  leave: "bg-sky-50 text-sky-700 ring-sky-200",
  early_leave: "bg-orange-50 text-orange-700 ring-orange-200",
  incomplete: "bg-slate-100 text-slate-700 ring-slate-200"
};

const requestStyles: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200"
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", attendanceStyles[status])}>
      {attendanceStatusLabels[status]}
    </span>
  );
}

export function RequestBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", requestStyles[status])}>
      {requestStatusLabels[status]}
    </span>
  );
}
