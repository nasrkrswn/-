import type { AttendanceStatus, RequestStatus, RequestType, UserRole } from "@/lib/types";

export const roleLabels: Record<UserRole, string> = {
  employee: "موظف",
  supervisor: "مشرف",
  manager: "مدير",
  admin: "مسؤول"
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  leave: "إجازة",
  early_leave: "انصراف مبكر",
  incomplete: "غير مكتمل"
};

export const requestTypeLabels: Record<RequestType, string> = {
  absence: "غياب",
  leave: "استئذان",
  correction: "تصحيح حضور"
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض"
};
