"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AttendanceBadge, RequestBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/components/auth-provider";
import { formatDate, formatDateTime, getTodayRange } from "@/lib/dates";
import { requestTypeLabels } from "@/lib/labels";
import { getBrowserSupabase } from "@/lib/supabase";
import type { AttendanceRecord, AttendanceRequest, RequestStatus } from "@/lib/types";

type AttendanceRow = AttendanceRecord & {
  profiles?: {
    full_name: string | null;
    department?: {
      name: string;
    } | null;
  } | null;
  work_locations?: {
    name: string;
  } | null;
};

type RequestRow = AttendanceRequest & {
  profiles?: {
    full_name: string | null;
  } | null;
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [loading, setLoading] = useState(true);

  const allowed = profile?.role === "manager" || profile?.role === "admin";

  const loadDashboard = useCallback(async () => {
    if (!supabase || !allowed) {
      return;
    }

    const { start, end } = getTodayRange();
    const [attendanceResult, requestResult, employeeResult] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("*, profiles:profiles!attendance_records_user_id_fkey(full_name, department:departments!profiles_department_id_fkey(name)), work_locations(name)")
        .gte("check_in_time", start)
        .lt("check_in_time", end)
        .order("check_in_time", { ascending: false }),
      supabase
        .from("attendance_requests")
        .select("*, profiles:profiles!attendance_requests_user_id_fkey(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("active", true).eq("role", "employee")
    ]);

    setAttendance((attendanceResult.data ?? []) as AttendanceRow[]);
    setRequests((requestResult.data ?? []) as RequestRow[]);
    setActiveEmployees(employeeResult.count ?? 0);
    setLoading(false);
  }, [allowed, supabase]);

  useEffect(() => {
    if (profile && !allowed) {
      router.replace("/unauthorized");
      return;
    }

    loadDashboard();
  }, [allowed, loadDashboard, profile, router]);

  const attendedEmployeeCount = new Set(attendance.map((record) => record.user_id)).size;
  const lateCount = new Set(attendance.filter((record) => record.status === "late").map((record) => record.user_id)).size;
  const incompleteCount = new Set(attendance.filter((record) => !record.check_out_time).map((record) => record.user_id)).size;

  async function reviewRequest(id: string, status: Extract<RequestStatus, "approved" | "rejected">) {
    if (!supabase || !profile) {
      return;
    }

    const { error } = await supabase
      .from("attendance_requests")
      .update({
        status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", id);

    if (!error) {
      await loadDashboard();
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="لوحة التحكم"
        description="متابعة حضور اليوم والطلبات المعلقة حسب الصلاحيات المطبقة في Supabase."
        actions={
          <Button variant="outline" onClick={loadDashboard}>
            تحديث
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="الموظفون النشطون" value={activeEmployees} />
        <StatCard label="حضور اليوم" value={attendedEmployeeCount} tone="success" />
        <StatCard label="المتأخرون" value={lateCount} tone="warning" />
        <StatCard label="داخل الدوام" value={incompleteCount} tone="info" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-lg font-bold text-ink-900">حضور اليوم</h2>
          </div>
          {attendance.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-ink-50 text-right text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">الموظف</th>
                    <th className="px-4 py-3 font-semibold">القسم</th>
                    <th className="px-4 py-3 font-semibold">الموقع</th>
                    <th className="px-4 py-3 font-semibold">الحالة</th>
                    <th className="px-4 py-3 font-semibold">الحضور</th>
                    <th className="px-4 py-3 font-semibold">الانصراف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {attendance.map((record) => (
                    <tr key={record.id} className="text-ink-700">
                      <td className="px-4 py-3 font-semibold text-ink-900">{record.profiles?.full_name ?? "-"}</td>
                      <td className="px-4 py-3">{record.profiles?.department?.name ?? "-"}</td>
                      <td className="px-4 py-3">{record.work_locations?.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        <AttendanceBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3">{formatDateTime(record.check_in_time)}</td>
                      <td className="px-4 py-3">{formatDateTime(record.check_out_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={loading ? "جاري تحميل البيانات" : "لا توجد سجلات حضور اليوم"} className="m-4" />
          )}
        </div>

        <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold text-ink-900">طلبات قيد المراجعة</h2>
          {requests.length ? (
            <div className="grid gap-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-ink-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink-900">{request.profiles?.full_name ?? "-"}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {requestTypeLabels[request.request_type]} - {formatDate(request.target_date)}
                      </p>
                    </div>
                    <RequestBadge status={request.status} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{request.reason}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => reviewRequest(request.id, "approved")}>
                      قبول
                    </Button>
                    <Button variant="ghost" onClick={() => reviewRequest(request.id, "rejected")}>
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد طلبات معلقة" />
          )}
        </div>
      </section>
    </div>
  );
}
