"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Department, Profile } from "@/lib/types";

type DepartmentRow = Department & {
  manager?: {
    full_name: string | null;
  } | null;
};

export default function DepartmentsPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const [departmentsResult, managersResult] = await Promise.all([
      supabase.from("departments").select("*, manager:profiles!departments_manager_id_fkey(full_name)").order("name"),
      supabase.from("profiles").select("*").in("role", ["manager", "admin", "supervisor"]).eq("active", true).order("full_name")
    ]);

    setDepartments((departmentsResult.data ?? []) as DepartmentRow[]);
    setManagers((managersResult.data ?? []) as Profile[]);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setManagerId("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const payload = {
      name,
      manager_id: managerId || null
    };

    const result = editingId
      ? await supabase.from("departments").update(payload).eq("id", editingId)
      : await supabase.from("departments").insert(payload);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage("تم حفظ القسم.");
    resetForm();
    await loadData();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="إدارة الأقسام" description="تعريف الأقسام وربط كل قسم بمدير أو مشرف عند الحاجة." />

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form className="grid content-start gap-4 rounded-lg border border-ink-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit}>
          <Field label="اسم القسم">
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>

          <Field label="المدير">
            <Select value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">بدون مدير محدد</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.full_name ?? manager.email ?? manager.id}
                </option>
              ))}
            </Select>
          </Field>

          {message ? <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-700">{message}</div> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              <Save className="h-4 w-4" aria-hidden />
              حفظ
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetForm}>
                إلغاء
              </Button>
            ) : null}
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
          {departments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-ink-50 text-right text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">القسم</th>
                    <th className="px-4 py-3 font-semibold">المدير</th>
                    <th className="px-4 py-3 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {departments.map((department) => (
                    <tr key={department.id} className="text-ink-700">
                      <td className="px-4 py-3 font-semibold text-ink-900">{department.name}</td>
                      <td className="px-4 py-3">{department.manager?.full_name ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(department.id);
                            setName(department.name);
                            setManagerId(department.manager_id ?? "");
                          }}
                        >
                          تعديل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="لا توجد أقسام بعد" className="m-4" />
          )}
        </div>
      </section>
    </div>
  );
}
