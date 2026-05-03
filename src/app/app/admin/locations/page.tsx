"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getBrowserSupabase } from "@/lib/supabase";
import type { WorkLocation } from "@/lib/types";

export default function LocationsPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("150");
  const [active, setActive] = useState("true");
  const [message, setMessage] = useState("");

  const loadLocations = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { data } = await supabase.from("work_locations").select("*").order("name");
    setLocations((data ?? []) as WorkLocation[]);
  }, [supabase]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setLatitude("");
    setLongitude("");
    setRadiusMeters("150");
    setActive("true");
  }

  async function fillCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setMessage("المتصفح لا يدعم قراءة الموقع.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setMessage("تم التقاط إحداثيات الجهاز.");
      },
      () => setMessage("تعذر التقاط الموقع الحالي."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const payload = {
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius_meters: Number(radiusMeters),
      active: active === "true"
    };

    const result = editingId
      ? await supabase.from("work_locations").update(payload).eq("id", editingId)
      : await supabase.from("work_locations").insert(payload);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage("تم حفظ الموقع.");
    resetForm();
    await loadLocations();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="تغيير الموقع"
        description="تعديل مواقع العمل والإحداثيات ونطاق السماح لتسجيل الحضور والانصراف."
        actions={
          <Button variant="outline" onClick={fillCurrentLocation}>
            <MapPin className="h-4 w-4" aria-hidden />
            التقاط موقعي
          </Button>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form className="grid content-start gap-4 rounded-lg border border-ink-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit}>
          <Field label="اسم الموقع">
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="خط العرض">
              <Input type="number" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} required />
            </Field>
            <Field label="خط الطول">
              <Input type="number" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} required />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="النطاق بالمتر">
              <Input type="number" min={10} value={radiusMeters} onChange={(event) => setRadiusMeters(event.target.value)} required />
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
          {locations.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-ink-50 text-right text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">الموقع</th>
                    <th className="px-4 py-3 font-semibold">الإحداثيات</th>
                    <th className="px-4 py-3 font-semibold">النطاق</th>
                    <th className="px-4 py-3 font-semibold">الحالة</th>
                    <th className="px-4 py-3 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {locations.map((location) => (
                    <tr key={location.id} className="text-ink-700">
                      <td className="px-4 py-3 font-semibold text-ink-900">{location.name}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {location.latitude}, {location.longitude}
                      </td>
                      <td className="px-4 py-3">{location.radius_meters} متر</td>
                      <td className="px-4 py-3">{location.active ? "نشط" : "موقوف"}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(location.id);
                            setName(location.name);
                            setLatitude(String(location.latitude));
                            setLongitude(String(location.longitude));
                            setRadiusMeters(String(location.radius_meters));
                            setActive(location.active ? "true" : "false");
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
            <EmptyState title="لا توجد مواقع بعد" className="m-4" />
          )}
        </div>
      </section>
    </div>
  );
}
