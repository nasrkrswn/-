"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { appConfig, hasSupabaseConfig } from "@/lib/config";

function ConfigRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <span className={ready ? "inline-flex items-center gap-2 text-sm font-bold text-emerald-700" : "inline-flex items-center gap-2 text-sm font-bold text-amber-700"}>
        {ready ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <CircleAlert className="h-4 w-4" aria-hidden />}
        {ready ? "موجود" : "ناقص"}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="الإعدادات" description="حالة الربط الأساسية المطلوبة لتشغيل النظام على البيئة الحالية." />

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink-900">متغيرات البيئة</h2>
        <div className="mt-4">
          <ConfigRow label="NEXT_PUBLIC_SUPABASE_URL" ready={Boolean(appConfig.supabaseUrl)} />
          <ConfigRow label="NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ready={Boolean(appConfig.supabasePublishableKey)} />
          <ConfigRow label="NEXT_PUBLIC_FACEBOOK_PIXEL_ID" ready={Boolean(appConfig.facebookPixelId)} />
          <ConfigRow label="Supabase جاهز للاستخدام" ready={hasSupabaseConfig()} />
        </div>
      </section>
    </div>
  );
}
