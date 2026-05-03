"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Shift } from "@/lib/types";

export default function ShiftsPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [graceMinutes, setGraceMinutes] = useState("10");
  const [active, setActive] = useState("true");
  const [message, setMessage] = useState("");

  const loadShifts = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { data } = await supabase.from("shifts").select("*").order("start_time");
    setShifts((data ?? []) as Shift[]);
  }, [supabase]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setStartTime("09:00");
    setEndTime("17:00");
    setGraceMinutes("10");
    setActive("true");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const payload = {
      name,
      start_time: startTime,
      end_time: endTime,
      grace_minutes: Number(graceMinutes),
      active: active === "true"
    };

    const result = editingId
      ? await supabase.from("shifts").update(payload).eq("id", editingId)
      : await supabase.from("shifts").insert(payload);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage("تم حفظ الوردية.");
    resetForm();
    await loadShifts();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="إدارة الورديات" description="ضبط أوقات الدوام وفترة السماح المستخدمة في احتساب التأخير." />

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form className="grid content-start gap-4 rounded-lg border border-ink-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit}>
          <Field label="اسم الوردية">
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="بداية الدوام">
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
            </Field>
            <Field label="نهاية الدوام">
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="فترة السماح">
              <Input type="number" min={0} value={graceMinutes} onChange={(event) => setGraceMinutes(event.target.value)} required />
            </Field>
            <Field label="الحالة">
              <Select value={active} onChange={(event) => setActive(event.target.value)}>
                <option value="true">نشط</option>
                <option value="false">موقوف</option>
              </Select>
            </Field>
          </div>

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
          {shifts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-ink-50 text-right text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">الوردية</th>
                    <th className="px-4 py-3 font-semibold">الوقت</th>
                    <th className="px-4 py-3 font-semibold">السماح</th>
                    <th className="px-4 py-3 font-semibold">الحالة</th>
                    <th className="px-4 py-3 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="text-ink-700">
                      <td className="px-4 py-3 font-semibold text-ink-900">{shift.name}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {shift.start_time} - {shift.end_time}
                      </td>
                      <td className="px-4 py-3">{shift.grace_minutes} دقيقة</td>
                      <td className="px-4 py-3">{shift.active ? "نشط" : "موقوف"}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(shift.id);
                            setName(shift.name);
                            setStartTime(shift.start_time.slice(0, 5));
                            setEndTime(shift.end_time.slice(0, 5));
                            setGraceMinutes(String(shift.grace_minutes));
                            setActive(shift.active ? "true" : "false");
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
            <EmptyState title="لا توجد ورديات بعد" className="m-4" />
          )}
        </div>
      </section>
    </div>
  );
}
