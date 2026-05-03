"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AttendanceBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/dates";
import { getBrowserSupabase } from "@/lib/supabase";
import type { AttendanceRecord } from "@/lib/types";

type AttendanceWithDetails = AttendanceRecord & {
  profiles?: {
    full_name: string | null;
    email: string | null;
    department?: {
      name: string;
    } | null;
  } | null;
  work_locations?: {
    name: string;
  } | null;
};

export default function HistoryPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [records, setRecords] = useState<AttendanceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const allowed = profile?.role === "manager" || profile?.role === "admin";

  const loadRecords = useCallback(async () => {
    if (!supabase || !allowed) {
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, profiles:profiles!attendance_records_user_id_fkey(full_name, email, department:departments!profiles_department_id_fkey(name)), work_locations(name)")
      .order("check_in_time", { ascending: false })
      .limit(200);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setRecords([]);
      return;
    }

    setRecords((data ?? []) as AttendanceWithDetails[]);
  }, [allowed, supabase]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const presentCount = records.filter((record) => record.status === "present").length;
  const lateCount = records.filter((record) => record.status === "late").length;
  const incompleteCount = records.filter((record) => !record.check_out_time).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="سجل الحضور الإداري"
        description="عرض سجلات حضور وانصراف الموظفين من لوحة التحكم، بدون الانتقال إلى صفحة الموظفين."
        actions={
          <Button variant="outline" onClick={loadRecords} disabled={loading || !allowed}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="إجمالي السجلات" value={records.length} />
        <StatCard label="حاضر" value={presentCount} tone="success" />
        <StatCard label="متأخر" value={lateCount} tone="warning" />
        <StatCard label="داخل الدوام" value={incompleteCount} tone="info" />
      </section>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          {message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
        {records.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-ink-50 text-right text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">الموظف</th>
                  <th className="px-4 py-3 font-semibold">القسم</th>
                  <th className="px-4 py-3 font-semibold">الموقع</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">الحضور</th>
                  <th className="px-4 py-3 font-semibold">الانصراف</th>
                  <th className="px-4 py-3 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {records.map((record) => (
                  <tr key={record.id} className="text-ink-700">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{record.profiles?.full_name ?? "-"}</p>
                      <p className="mt-1 text-xs text-ink-500">{record.profiles?.email ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3">{record.profiles?.department?.name ?? "-"}</td>
                    <td className="px-4 py-3">{record.work_locations?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3">{formatDateTime(record.check_in_time)}</td>
                    <td className="px-4 py-3">{formatDateTime(record.check_out_time)}</td>
                    <td className="px-4 py-3">{record.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={loading ? "جاري تحميل السجل الإداري" : "لا توجد سجلات حضور"} className="m-4" />
        )}
      </section>
    </div>
  );
}
