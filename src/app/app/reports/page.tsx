"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AttendanceBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/dates";
import { exportAttendanceExcel, exportAttendancePdf } from "@/lib/export";
import { attendanceStatusLabels } from "@/lib/labels";
import { getBrowserSupabase } from "@/lib/supabase";
import type { AttendanceRecord, AttendanceStatus, ReportRow } from "@/lib/types";

type ReportRecord = AttendanceRecord & {
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

const statusOptions: Array<{ value: AttendanceStatus | "all"; label: string }> = [
  { value: "all", label: "كل الحالات" },
  { value: "present", label: attendanceStatusLabels.present },
  { value: "late", label: attendanceStatusLabels.late },
  { value: "absent", label: attendanceStatusLabels.absent },
  { value: "leave", label: attendanceStatusLabels.leave },
  { value: "early_leave", label: attendanceStatusLabels.early_leave },
  { value: "incomplete", label: attendanceStatusLabels.incomplete }
];

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    from: toDateInputValue(firstDay),
    to: toDateInputValue(today)
  };
}

function getDateStart(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function getDateEnd(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

function toReportRows(records: ReportRecord[]): ReportRow[] {
  return records.map((record) => ({
    employeeName: record.profiles?.full_name ?? "-",
    departmentName: record.profiles?.department?.name ?? "-",
    locationName: record.work_locations?.name ?? "-",
    status: record.status,
    checkIn: formatDateTime(record.check_in_time),
    checkOut: formatDateTime(record.check_out_time),
    notes: record.notes ?? "-"
  }));
}

export default function ReportsPage() {
  const router = useRouter();
  const { loading: authLoading, profile } = useAuth();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [status, setStatus] = useState<AttendanceStatus | "all">("all");
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [message, setMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const allowed = profile?.role === "manager" || profile?.role === "admin";
  const reportRows = useMemo(() => toReportRows(records), [records]);
  const uniqueEmployees = useMemo(() => new Set(records.map((record) => record.user_id)).size, [records]);
  const lateCount = records.filter((record) => record.status === "late").length;
  const incompleteCount = records.filter((record) => record.status === "incomplete" || !record.check_out_time).length;

  const loadReports = useCallback(async () => {
    if (!supabase || !allowed) {
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setMessage("تاريخ البداية يجب أن يكون قبل تاريخ النهاية.");
      setRecords([]);
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    setMessage("");

    let query = supabase
      .from("attendance_records")
      .select(
        "*, profiles:profiles!attendance_records_user_id_fkey(full_name, email, department:departments!profiles_department_id_fkey(name)), work_locations(name)"
      )
      .order("check_in_time", { ascending: false })
      .limit(1000);

    if (fromDate) {
      query = query.gte("check_in_time", getDateStart(fromDate));
    }

    if (toDate) {
      query = query.lte("check_in_time", getDateEnd(toDate));
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    setLoading(false);
    setHasLoaded(true);

    if (error) {
      setMessage(error.message);
      setRecords([]);
      return;
    }

    setRecords((data ?? []) as ReportRecord[]);
  }, [allowed, fromDate, status, supabase, toDate]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (profile && !allowed) {
      router.replace("/unauthorized");
      return;
    }

    if (profile && allowed && !hasLoaded) {
      void loadReports();
    }
  }, [allowed, authLoading, hasLoaded, loadReports, profile, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadReports();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التقارير"
        description="فلترة سجلات الحضور وتصديرها بصيغ Excel و PDF حسب التاريخ والحالة."
        actions={
          <>
            <Button variant="outline" onClick={() => exportAttendanceExcel(reportRows)} disabled={!reportRows.length}>
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              إكسل
            </Button>
            <Button variant="outline" onClick={() => exportAttendancePdf(reportRows)} disabled={!reportRows.length}>
              <Download className="h-4 w-4" aria-hidden />
              ملف PDF
            </Button>
          </>
        }
      />

      <form className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
          <Field label="من تاريخ">
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </Field>
          <Field label="إلى تاريخ">
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </Field>
          <Field label="الحالة">
            <Select value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus | "all")}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={loading || !allowed}>
            <Search className="h-4 w-4" aria-hidden />
            {loading ? "جاري العرض" : "عرض"}
          </Button>
          <Button variant="outline" onClick={loadReports} disabled={loading || !allowed}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            تحديث
          </Button>
        </div>
        {message ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</div> : null}
      </form>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="إجمالي السجلات" value={records.length} />
        <StatCard label="الموظفون" value={uniqueEmployees} tone="info" />
        <StatCard label="المتأخرون" value={lateCount} tone="warning" />
        <StatCard label="غير مكتمل" value={incompleteCount} tone="danger" />
      </section>

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
          <EmptyState
            title={
              loading
                ? "جاري تحميل التقرير"
                : hasLoaded
                  ? "لا توجد سجلات مطابقة للفلاتر"
                  : "سيظهر تقرير الشهر الحالي تلقائيًا"
            }
            className="m-4"
          />
        )}
      </section>
    </div>
  );
}
