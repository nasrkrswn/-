"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getBrowserSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!supabase) {
    return <SetupNotice />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("بيانات Supabase غير مكتملة.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });

    setSubmitting(false);
    setMessage(error ? error.message : "تم إرسال رابط استعادة كلمة المرور إلى البريد.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-ink-200 bg-white p-6 shadow-soft">
        <div className="mb-6 grid gap-2">
          <p className="text-sm font-semibold text-brand-700">استعادة كلمة المرور</p>
          <h1 className="text-2xl font-bold text-ink-900">أرسل رابط الاستعادة</h1>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="البريد الإلكتروني">
            <div className="relative">
              <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <Input
                className="pr-10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </Field>

          {message ? (
            <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm leading-6 text-ink-700">{message}</div>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "جاري الإرسال" : "إرسال الرابط"}
          </Button>
        </form>

        <Link className="mt-5 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600" href="/login">
          العودة لتسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
