import { AlertTriangle } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="mx-auto grid min-h-screen max-w-3xl place-items-center px-4 py-10">
      <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-6 text-ink-900 shadow-soft">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-6 w-6 text-amber-600" aria-hidden />
          <div className="grid gap-3">
            <h1 className="text-xl font-bold">بيانات Supabase غير مضافة بعد</h1>
            <p className="text-sm leading-7 text-ink-700">
              أضف القيم التالية في ملف <span className="font-mono">.env.local</span> ثم شغل التطبيق مرة أخرى.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-white p-4 text-left text-xs leading-6 text-ink-700" dir="ltr">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=...
NEXT_PUBLIC_COMPANY_NAME=حضورك
NEXT_PUBLIC_APP_LANGUAGE=ar
NEXT_PUBLIC_BRAND_PRIMARY=#0f766e
NEXT_PUBLIC_COMPANY_LOGO_URL=...
NEXT_PUBLIC_EMPLOYEE_EMAIL_DOMAIN=...`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
