"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { roleLabels } from "@/lib/labels";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Department, Profile, UserRole } from "@/lib/types";

type ProfileRow = Profile;

export default function EmployeesPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [employees, setEmployees] = useState<ProfileRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const [employeesResult, departmentsResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("departments").select("*").order("name")
    ]);

    setEmployees((employeesResult.data ?? []) as ProfileRow[]);
    setDepartments((departmentsResult.data ?? []) as Department[]);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateEmployee(id: string, payload: Partial<Profile>) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("profiles").update(payload).eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("تم تحديث بيانات الموظف.");
    await loadData();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="إدارة الموظفين"
        description="تعديل الدور والقسم وحالة التفعيل للحسابات الموجودة في Supabase Auth."
        actions={
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            تحديث
          </Button>
        }
      />

      {message ? <div className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700 shadow-soft">{message}</div> : null}

      <section className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
        {employees.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-ink-50 text-right text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">الاسم</th>
                  <th className="px-4 py-3 font-semibold">البريد</th>
                  <th className="px-4 py-3 font-semibold">الدور</th>
                  <th className="px-4 py-3 font-semibold">القسم</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {employees.map((employee) => (
                  <tr key={employee.id} className="text-ink-700">
                    <td className="px-4 py-3 font-semibold text-ink-900">{employee.full_name ?? "-"}</td>
                    <td className="px-4 py-3">{employee.email ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={employee.role}
                        onChange={(event) => updateEmployee(employee.id, { role: event.target.value as UserRole })}
                      >
                        <option value="employee">{roleLabels.employee}</option>
                        <option value="supervisor">{roleLabels.supervisor}</option>
                        <option value="manager">{roleLabels.manager}</option>
                        <option value="admin">{roleLabels.admin}</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={employee.department_id ?? ""}
                        onChange={(event) => updateEmployee(employee.id, { department_id: event.target.value || null })}
                      >
                        <option value="">بدون قسم</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={employee.active ? "active" : "inactive"}
                        onChange={(event) => updateEmployee(employee.id, { active: event.target.value === "active" })}
                      >
                        <option value="active">نشط</option>
                        <option value="inactive">موقوف</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="لا توجد حسابات موظفين بعد" className="m-4" />
        )}
      </section>
    </div>
  );
}
