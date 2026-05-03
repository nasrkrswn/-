"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { brand } from "@/lib/brand";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/types";

const CONTROL_EMAIL = "nasrkrswn@gmail.com";
const controlRoles: UserRole[] = ["admin", "manager"];

type LoginType = "general" | "control" | "employee";

function isControlProfile(email: string | undefined | null, profile: Pick<Profile, "role"> | null) {
  return email?.toLowerCase() === CONTROL_EMAIL && Boolean(profile && controlRoles.includes(profile.role));
}

function destinationFor(loginType: LoginType, profile: Pick<Profile, "role"> | null) {
  if (loginType === "control") {
    return "/app/dashboard";
  }

  if (loginType === "employee") {
    return "/employees";
  }

  return profile && controlRoles.includes(profile.role) ? "/app/dashboard" : "/employees";
}

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading, missingConfig } = useAuth();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [loginType, setLoginType] = useState<LoginType>("general");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isControlLogin = loginType === "control";
  const isEmployeeLogin = loginType === "employee";

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    const nextType = type === "control" || type === "employee" ? type : "general";

    setLoginType(nextType);

    if (nextType === "control") {
      setEmail(CONTROL_EMAIL);
    }
  }, []);

  useEffect(() => {
    if (isControlLogin) {
      setEmail(CONTROL_EMAIL);
    }
  }, [isControlLogin]);

  useEffect(() => {
    if (!loading && user) {
      if (isControlLogin && !isControlProfile(user.email, profile)) {
        router.replace("/unauthorized");
        return;
      }

      router.replace(destinationFor(loginType, profile));
    }
  }, [isControlLogin, loading, loginType, profile, router, user]);

  if (missingConfig) {
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

    const result = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    const signedInUser = result.data.user;
    const { data: signedInProfile } = signedInUser
      ? await supabase.from("profiles").select("role").eq("id", signedInUser.id).maybeSingle()
      : { data: null };

    if (isControlLogin && !isControlProfile(signedInUser?.email, signedInProfile as Pick<Profile, "role"> | null)) {
      await supabase.auth.signOut();
      setMessage("هذه صفحة التحكم، ويسمح بالدخول لها بحساب الإدارة فقط.");
      return;
    }

    router.replace(destinationFor(loginType, signedInProfile as Pick<Profile, "role"> | null));
  }

  return (
    <main className="grid min-h-screen bg-ink-50 lg:grid-cols-[1fr_560px]">
      <section className="hidden min-h-screen bg-ink-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt="" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-500">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
          )}
          <div>
            <p className="text-xl font-bold">{brand.name}</p>
            <p className="text-sm text-brand-100">إدارة حضور الشركة بثقة ووضوح</p>
          </div>
        </div>
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold leading-tight">دخول منفصل للإدارة والموظفين بصلاحيات واضحة.</h1>
          <p className="mt-5 text-base leading-8 text-ink-100">
            الموظف يدخل إلى صفحة تسجيل الحضور، والإدارة تدخل إلى لوحة التحكم بحساب الإدارة المعتمد.
          </p>
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-ink-200 bg-white p-6 shadow-soft">
          <div className="mb-6 grid gap-2">
            <p className="text-sm font-semibold text-brand-700">
              {isControlLogin ? "دخول صفحة التحكم" : isEmployeeLogin ? "دخول الموظفين" : "تسجيل الدخول"}
            </p>
            <h2 className="text-2xl font-bold text-ink-900">
              {isControlLogin ? "لوحة الإدارة" : isEmployeeLogin ? "صفحة الموظف" : "مرحبًا بك من جديد"}
            </h2>
            {isControlLogin ? (
              <p className="text-sm leading-7 text-ink-500">هذه الصفحة مخصصة لحساب الإدارة فقط.</p>
            ) : isEmployeeLogin ? (
              <p className="text-sm leading-7 text-ink-500">يدخل كل موظف بالبريد الإلكتروني وكلمة المرور الخاصة به.</p>
            ) : null}
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
                  autoComplete="email"
                  readOnly={isControlLogin}
                  required
                />
              </div>
            </Field>

            <Field label="كلمة المرور">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <Input
                  className="pr-10"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
              </div>
            </Field>

            {message ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                {message}
              </div>
            ) : null}

            <Button type="submit" disabled={submitting}>
              {submitting ? "جاري التنفيذ" : "دخول"}
            </Button>
          </form>

          <div className="mt-5 grid gap-3 text-sm">
            <button className="justify-self-start text-ink-500 hover:text-ink-900" onClick={() => router.push("/reset-password")}>
              نسيت كلمة المرور؟
            </button>
            <div className="flex flex-wrap gap-3 border-t border-ink-100 pt-3">
              <button className="font-semibold text-brand-700 hover:text-brand-600" onClick={() => router.push("/control")}>
                صفحة التحكم
              </button>
              <button className="font-semibold text-brand-700 hover:text-brand-600" onClick={() => router.push("/employees")}>
                صفحة الموظفين
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
