import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-ink-200 bg-white p-6 text-center shadow-soft">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-ink-900">لا توجد صلاحية</h1>
        <p className="mt-2 text-sm leading-7 text-ink-500">الحساب الحالي لا يملك صلاحية الوصول لهذه الصفحة.</p>
        <Link
          href="/app/dashboard"
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          الرجوع للوحة التحكم
        </Link>
      </section>
    </main>
  );
}
