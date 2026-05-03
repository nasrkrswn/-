"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { RequestBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/dates";
import { requestStatusLabels, requestTypeLabels } from "@/lib/labels";
import { getBrowserSupabase } from "@/lib/supabase";
import type { AttendanceRequest, RequestStatus } from "@/lib/types";

type RequestRow = AttendanceRequest & {
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
  reviewer?: {
    full_name: string | null;
  } | null;
};

export default function RequestsPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const allowed = profile?.role === "manager" || profile?.role === "admin";

  const loadRequests = useCallback(async () => {
    if (!supabase || !allowed) {
      return;
    }

    setLoading(true);
    setMessage("");

    let query = supabase
      .from("attendance_requests")
      .select("*, profiles:profiles!attendance_requests_user_id_fkey(full_name, email), reviewer:profiles!attendance_requests_reviewed_by_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setRequests([]);
      return;
    }

    setRequests((data ?? []) as RequestRow[]);
  }, [allowed, status, supabase]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function reviewRequest(id: string, nextStatus: Extract<RequestStatus, "approved" | "rejected">) {
    if (!supabase || !profile) {
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("attendance_requests")
      .update({
        status: nextStatus,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadRequests();
  }

  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const approvedCount = requests.filter((request) => request.status === "approved").length;
  const rejectedCount = requests.filter((request) => request.status === "rejected").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="إدارة الطلبات"
        description="مراجعة طلبات الموظفين من لوحة التحكم فقط، مع قبول أو رفض الطلب بدون فتح صفحة الموظفين."
        actions={
          <Button variant="outline" onClick={loadRequests} disabled={loading || !allowed}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={requests.length} />
        <StatCard label="قيد المراجعة" value={pendingCount} tone="warning" />
        <StatCard label="مقبولة" value={approvedCount} tone="success" />
        <StatCard label="مرفوضة" value={rejectedCount} tone="default" />
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft">
        <div className="max-w-xs">
          <Field label="حالة الطلب">
            <Select value={status} onChange={(event) => setStatus(event.target.value as RequestStatus | "all")}>
              <option value="all">كل الطلبات</option>
              <option value="pending">{requestStatusLabels.pending}</option>
              <option value="approved">{requestStatusLabels.approved}</option>
              <option value="rejected">{requestStatusLabels.rejected}</option>
            </Select>
          </Field>
        </div>

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
            {message}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
        {requests.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-sm">
              <thead className="bg-ink-50 text-right text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">الموظف</th>
                  <th className="px-4 py-3 font-semibold">نوع الطلب</th>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">السبب</th>
                  <th className="px-4 py-3 font-semibold">المراجعة</th>
                  <th className="px-4 py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {requests.map((request) => (
                  <tr key={request.id} className="text-ink-700">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{request.profiles?.full_name ?? "-"}</p>
                      <p className="mt-1 text-xs text-ink-500">{request.profiles?.email ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{requestTypeLabels[request.request_type]}</td>
                    <td className="px-4 py-3">{formatDate(request.target_date)}</td>
                    <td className="px-4 py-3">
                      <RequestBadge status={request.status} />
                    </td>
                    <td className="max-w-md px-4 py-3 leading-7">{request.reason}</td>
                    <td className="px-4 py-3">
                      {request.reviewed_at ? (
                        <div className="grid gap-1">
                          <span>{request.reviewer?.full_name ?? "-"}</span>
                          <span className="text-xs text-ink-500">{formatDateTime(request.reviewed_at)}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {request.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => reviewRequest(request.id, "approved")}>
                            <Check className="h-4 w-4" aria-hidden />
                            قبول
                          </Button>
                          <Button variant="ghost" onClick={() => reviewRequest(request.id, "rejected")}>
                            <X className="h-4 w-4" aria-hidden />
                            رفض
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-ink-500">تمت المراجعة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={loading ? "جاري تحميل الطلبات" : "لا توجد طلبات بهذه الحالة"} className="m-4" />
        )}
      </section>
    </div>
  );
}
