"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  LocateFixed,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Send,
  UserPlus,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth-provider";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { AttendanceBadge, RequestBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { appConfig } from "@/lib/config";
import { formatDate, formatDateTime, formatTime, getTodayRange } from "@/lib/dates";
import { findNearestLocation, readBrowserPosition, type GeoPoint, type LocationMatch } from "@/lib/geo";
import { attendanceStatusLabels, requestTypeLabels } from "@/lib/labels";
import { getBrowserSupabase } from "@/lib/supabase";
import type { AttendanceRecord, AttendanceRequest, AttendanceStatus, RequestType, WorkLocation } from "@/lib/types";

const EMPLOYEE_EMAIL_DOMAIN = appConfig.employeeEmailDomain.trim().toLowerCase().replace(/^@/, "");

type AttendanceWithLocation = AttendanceRecord & {
  work_locations?: {
    name: string;
  } | null;
};

type EmployeeAuthMode = "login" | "signup";

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (normalized.includes("email not confirmed")) {
    return "يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.";
  }

  if (normalized.includes("password") && normalized.includes("at least")) {
    return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "إنشاء الحسابات غير مفعل حاليًا في Supabase.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "تمت محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  }

  return message || "تعذر تنفيذ العملية. حاول مرة أخرى.";
}

async function readSignupError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || "تعذر إنشاء حساب الموظف.";
  } catch {
    return "تعذر إنشاء حساب الموظف.";
  }
}

function isAllowedEmployeeEmail(email: string | null | undefined) {
  if (!EMPLOYEE_EMAIL_DOMAIN) {
    return true;
  }

  return email?.toLowerCase().endsWith(`@${EMPLOYEE_EMAIL_DOMAIN}`) ?? false;
}

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

export default function EmployeesPortalPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, missingConfig, signOut } = useAuth();
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const activeUserId = user?.id ?? null;
  const activeUserIdRef = useRef<string | null>(activeUserId);
  const [authMode, setAuthMode] = useState<EmployeeAuthMode>("login");
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageTone, setAuthMessageTone] = useState<"error" | "success">("error");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [employeePasswordConfirmation, setEmployeePasswordConfirmation] = useState("");
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [records, setRecords] = useState<AttendanceWithLocation[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [activeRecord, setActiveRecord] = useState<AttendanceWithLocation | null>(null);
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [nearest, setNearest] = useState<LocationMatch | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("absence");
  const [targetDate, setTargetDate] = useState(todayInputValue);
  const [reason, setReason] = useState("");
  const [oldStatus, setOldStatus] = useState<AttendanceStatus>("absent");
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("present");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
    setLocations([]);
    setRecords([]);
    setRequests([]);
    setActiveRecord(null);
    setPosition(null);
    setNearest(null);
    setDataLoading(false);
    setAttendanceMessage("");
    setRequestMessage("");
  }, [activeUserId]);

  const loadEmployeeData = useCallback(async () => {
    if (!supabase || !user) {
      return;
    }

    setDataLoading(true);
    const currentUserId = user.id;
    const { start, end } = getTodayRange();

    const [locationsResult, recordsResult, requestsResult] = await Promise.all([
      supabase.from("work_locations").select("*").eq("active", true).order("name"),
      supabase
        .from("attendance_records")
        .select("*, work_locations(name)")
        .eq("user_id", user.id)
        .gte("check_in_time", start)
        .lt("check_in_time", end)
        .order("check_in_time", { ascending: false }),
      supabase
        .from("attendance_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
    ]);

    const firstError = locationsResult.error ?? recordsResult.error ?? requestsResult.error;
    const nextRecords = (recordsResult.data ?? []) as AttendanceWithLocation[];

    if (activeUserIdRef.current !== currentUserId) {
      return;
    }

    setLocations((locationsResult.data ?? []) as WorkLocation[]);
    setRecords(nextRecords);
    setRequests((requestsResult.data ?? []) as AttendanceRequest[]);
    setActiveRecord(nextRecords.find((record) => !record.check_out_time) ?? null);
    setDataLoading(false);

    if (firstError) {
      setAttendanceMessage(firstError.message);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!user) {
      setLocations([]);
      setRecords([]);
      setRequests([]);
      setActiveRecord(null);
      setPosition(null);
      setNearest(null);
      setDataLoading(false);
      return;
    }

    if (!isAllowedEmployeeEmail(user.email)) {
      void signOut();
      setAuthMessageTone("error");
      setAuthMessage(`هذا الحساب غير مسموح له بالدخول. استخدم بريد الشركة بدومين ${EMPLOYEE_EMAIL_DOMAIN}.`);
      return;
    }

    void loadEmployeeData();
  }, [loadEmployeeData, signOut, user]);

  function switchAuthMode(nextMode: EmployeeAuthMode) {
    setAuthMode(nextMode);
    setAuthMessage("");
    setEmployeePassword("");
    setEmployeePasswordConfirmation("");
  }

  async function handleEmployeeLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setAuthMessage("بيانات Supabase غير مكتملة.");
      setAuthMessageTone("error");
      return;
    }

    const normalizedEmail = employeeEmail.trim().toLowerCase();

    if (!isAllowedEmployeeEmail(normalizedEmail)) {
      setAuthMessageTone("error");
      setAuthMessage(`هذا البريد غير مسموح له بالدخول. استخدم بريد الشركة بدومين ${EMPLOYEE_EMAIL_DOMAIN}.`);
      return;
    }

    setAuthSubmitting(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: employeePassword
    });

    setAuthSubmitting(false);

    if (error) {
      setAuthMessageTone("error");
      setAuthMessage(getAuthErrorMessage(error.message));
      return;
    }

    setEmployeePassword("");
  }

  async function handleEmployeeSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setAuthMessageTone("error");
      setAuthMessage("بيانات Supabase غير مكتملة.");
      return;
    }

    const normalizedEmail = employeeEmail.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setAuthMessageTone("error");
      setAuthMessage("اكتب اسم الموظف قبل إنشاء الحساب.");
      return;
    }

    if (!isAllowedEmployeeEmail(normalizedEmail)) {
      setAuthMessageTone("error");
      setAuthMessage(`هذا البريد غير مسموح له بإنشاء حساب. استخدم بريد الشركة بدومين ${EMPLOYEE_EMAIL_DOMAIN}.`);
      return;
    }

    if (employeePassword !== employeePasswordConfirmation) {
      setAuthMessageTone("error");
      setAuthMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setAuthSubmitting(true);
    setAuthMessage("");

    const signupResponse = await fetch("/api/employees/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: trimmedName,
        email: normalizedEmail,
        password: employeePassword
      })
    });

    if (!signupResponse.ok) {
      setAuthSubmitting(false);
      setAuthMessageTone("error");
      setAuthMessage(await readSignupError(signupResponse));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: employeePassword
    });

    setAuthSubmitting(false);

    if (error) {
      setAuthMessageTone("error");
      setAuthMessage(getAuthErrorMessage(error.message));
      return;
    }

    setEmployeePassword("");
    setEmployeePasswordConfirmation("");
    setAuthMessageTone("success");
    setAuthMessage("تم إنشاء الحساب وتسجيل الدخول. يمكنك الآن تسجيل الحضور والانصراف.");
    return;
  }

  async function handleSignOut() {
    await signOut();
    setAuthMessage("");
    setAttendanceMessage("");
    setRequestMessage("");
  }

  async function refreshPosition() {
    setAttendanceMessage("");
    const nextPosition = await readBrowserPosition();
    const nextNearest = findNearestLocation(nextPosition, locations);

    setPosition(nextPosition);
    setNearest(nextNearest);

    if (!nextNearest) {
      throw new Error("لا يوجد موقع عمل نشط.");
    }

    if (!nextNearest.isInside) {
      throw new Error(`أنت خارج نطاق ${nextNearest.location.name}. المسافة الحالية ${Math.round(nextNearest.distanceMeters)} متر.`);
    }

    return {
      nextPosition,
      nextNearest
    };
  }

  async function handleCheckIn() {
    if (!supabase || !user) {
      return;
    }

    setSubmittingAttendance(true);
    setAttendanceMessage("");

    try {
      const { nextPosition, nextNearest } = await refreshPosition();
      const { error } = await supabase.from("attendance_records").insert({
        user_id: user.id,
        work_location_id: nextNearest.location.id,
        check_in_time: new Date().toISOString(),
        check_in_latitude: nextPosition.latitude,
        check_in_longitude: nextPosition.longitude,
        status: "present"
      });

      if (error) {
        throw error;
      }

      setAttendanceMessage("تم تسجيل الحضور بنجاح، وسيظهر في لوحة التحكم.");
      await loadEmployeeData();
    } catch (error) {
      setAttendanceMessage(error instanceof Error ? error.message : "تعذر تسجيل الحضور.");
    } finally {
      setSubmittingAttendance(false);
    }
  }

  async function handleCheckOut() {
    if (!supabase || !activeRecord) {
      return;
    }

    setSubmittingAttendance(true);
    setAttendanceMessage("");

    try {
      const { nextPosition, nextNearest } = await refreshPosition();
      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out_time: new Date().toISOString(),
          check_out_latitude: nextPosition.latitude,
          check_out_longitude: nextPosition.longitude,
          work_location_id: activeRecord.work_location_id ?? nextNearest.location.id
        })
        .eq("id", activeRecord.id);

      if (error) {
        throw error;
      }

      setAttendanceMessage("تم تسجيل الانصراف بنجاح، وتم تحديث لوحة التحكم.");
      await loadEmployeeData();
    } catch (error) {
      setAttendanceMessage(error instanceof Error ? error.message : "تعذر تسجيل الانصراف.");
    } finally {
      setSubmittingAttendance(false);
    }
  }

  async function handleRefreshLocation() {
    setSubmittingAttendance(true);
    setAttendanceMessage("");

    try {
      await refreshPosition();
      setAttendanceMessage("تم تحديث الموقع الحالي.");
    } catch (error) {
      setAttendanceMessage(error instanceof Error ? error.message : "تعذر تحديث الموقع.");
    } finally {
      setSubmittingAttendance(false);
    }
  }

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      return;
    }

    setRequestSubmitting(true);
    setRequestMessage("");

    const payload = {
      user_id: user.id,
      request_type: requestType,
      target_date: targetDate,
      reason,
      ...(requestType === "correction"
        ? {
            old_status: oldStatus,
            new_status: newStatus
          }
        : {})
    };

    const { error } = await supabase.from("attendance_requests").insert(payload);

    setRequestSubmitting(false);

    if (error) {
      setRequestMessage(error.message);
      return;
    }

    setReason("");
    setTargetDate(todayInputValue());
    setRequestType("absence");
    setRequestMessage("تم إرسال الطلب للإدارة وسيظهر في لوحة التحكم.");
    await loadEmployeeData();
  }

  if (missingConfig) {
    return <SetupNotice />;
  }

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink-50 px-4">
        <div className="rounded-lg border border-ink-200 bg-white px-6 py-4 text-ink-700 shadow-soft">جاري تحميل صفحة الموظفين</div>
      </main>
    );
  }

  const lastRecord = records[0];
  const pendingRequests = requests.filter((request) => request.status === "pending").length;

  if (!user) {
    return (
      <main className="min-h-screen bg-ink-50">
        <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_430px]">
          <div className="grid gap-6">
            <BrandLogo size="lg" subtitle="بوابة مستقلة للموظفين" />

            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-700">صفحة الموظفين</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-ink-900 md:text-5xl">تسجيل الحضور والطلبات من صفحة منفصلة عن لوحة التحكم.</h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-ink-600">
                كل موظف يدخل بحسابه الخاص، وكل عملية حضور أو طلب تحفظ مباشرة في Supabase لتظهر للإدارة في لوحة التحكم.
              </p>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-ink-200 bg-white p-6 shadow-soft">
            <div className="mb-2">
              <p className="text-sm font-semibold text-brand-700">دخول الموظف</p>
              <h2 className="mt-2 text-2xl font-bold text-ink-900">{authMode === "login" ? "تسجيل دخول الموظف" : "إنشاء حساب موظف"}</h2>
              <p className="mt-2 text-sm leading-7 text-ink-500">
                كل موظف يستخدم حسابه المستقل لتسجيل الحضور والانصراف، بدون دخول إلى لوحة التحكم.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-100 p-1">
              <button
                type="button"
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${
                  authMode === "login" ? "bg-white text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
                }`}
                onClick={() => switchAuthMode("login")}
              >
                دخول
              </button>
              <button
                type="button"
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${
                  authMode === "signup" ? "bg-white text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
                }`}
                onClick={() => switchAuthMode("signup")}
              >
                إنشاء حساب
              </button>
            </div>

            {authMessage ? (
              <div
                className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
                  authMessageTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {authMessage}
              </div>
            ) : null}

            <form className="grid gap-4" onSubmit={authMode === "login" ? handleEmployeeLogin : handleEmployeeSignup}>
              {authMode === "signup" ? (
                <Field label="اسم الموظف">
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                    <Input
                      className="pr-10"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </Field>
              ) : null}

              <Field label="البريد الإلكتروني">
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <Input
                    className="pr-10"
                    type="email"
                    value={employeeEmail}
                    onChange={(event) => setEmployeeEmail(event.target.value)}
                    autoComplete="email"
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
                    value={employeePassword}
                    onChange={(event) => setEmployeePassword(event.target.value)}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    minLength={6}
                    required
                  />
                </div>
              </Field>

              {authMode === "signup" ? (
                <Field label="تأكيد كلمة المرور">
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                    <Input
                      className="pr-10"
                      type="password"
                      value={employeePasswordConfirmation}
                      onChange={(event) => setEmployeePasswordConfirmation(event.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                </Field>
              ) : null}

              <Button type="submit" disabled={authSubmitting}>
                {authMode === "signup" ? <UserPlus className="h-4 w-4" aria-hidden /> : <UserRound className="h-4 w-4" aria-hidden />}
                {authSubmitting ? "جاري التنفيذ" : authMode === "signup" ? "إنشاء الحساب" : "دخول صفحة الموظف"}
              </Button>
            </form>

            <button type="button" className="justify-self-start text-sm font-semibold text-brand-700 hover:text-brand-600" onClick={() => router.push("/control")}>
              دخول صفحة التحكم
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <BrandLogo size="md" subtitle="صفحة الموظفين" />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6">
        <section className="grid gap-3">
          <p className="text-sm font-semibold text-brand-700">مرحبًا، {profile?.full_name ?? user.email}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-ink-900 md:text-4xl">تسجيل الحضور والانصراف</h1>
              <p className="mt-2 text-sm leading-7 text-ink-500">هذه الصفحة مستقلة عن لوحة التحكم، لكنها مربوطة بنفس قاعدة بيانات Supabase.</p>
            </div>
            <Button variant="outline" onClick={handleRefreshLocation} disabled={submittingAttendance || !locations.length}>
              <LocateFixed className="h-4 w-4" aria-hidden />
              تحديث الموقع
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="حالة اليوم" value={activeRecord ? "داخل الدوام" : lastRecord ? "مكتمل" : "لم يبدأ"} tone="info" />
          <StatCard label="آخر حضور" value={lastRecord ? formatTime(lastRecord.check_in_time) : "-"} tone="success" />
          <StatCard label="مواقع نشطة" value={locations.length} />
          <StatCard label="طلبات معلقة" value={pendingRequests} tone={pendingRequests ? "warning" : "default"} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="grid gap-6">
            <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft">
              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      {activeRecord ? <Clock3 className="h-7 w-7" aria-hidden /> : <CheckCircle2 className="h-7 w-7" aria-hidden />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-ink-900">{activeRecord ? "أنت مسجل حضور حاليًا" : "جاهز لتسجيل الحضور"}</h2>
                      <p className="mt-1 text-sm leading-7 text-ink-500">
                        {activeRecord ? `بدأ الحضور في ${formatDateTime(activeRecord.check_in_time)}` : "سيتم التحقق من الموقع قبل حفظ العملية."}
                      </p>
                    </div>
                  </div>

                  {nearest ? (
                    <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                      أقرب موقع: <span className="font-bold">{nearest.location.name}</span>، المسافة{" "}
                      <span className="font-bold">{Math.round(nearest.distanceMeters)} متر</span>
                    </div>
                  ) : position ? (
                    <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                      تم قراءة الموقع بدقة تقريبية {Math.round(position.accuracy ?? 0)} متر.
                    </div>
                  ) : null}

                  {attendanceMessage ? (
                    <div className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm leading-6 text-ink-700">
                      {attendanceMessage}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {activeRecord ? (
                      <Button variant="secondary" onClick={handleCheckOut} disabled={submittingAttendance}>
                        <LogOut className="h-4 w-4" aria-hidden />
                        {submittingAttendance ? "جاري التسجيل" : "تسجيل الانصراف"}
                      </Button>
                    ) : (
                      <Button onClick={handleCheckIn} disabled={submittingAttendance || dataLoading || !locations.length}>
                        <MapPin className="h-4 w-4" aria-hidden />
                        {submittingAttendance ? "جاري التسجيل" : "تسجيل الحضور"}
                      </Button>
                    )}
                    <Button variant="ghost" onClick={loadEmployeeData} disabled={dataLoading}>
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      تحديث البيانات
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-ink-200 p-4">
                  <p className="mb-3 text-sm font-bold text-ink-900">سجل اليوم</p>
                  {records.length ? (
                    <div className="grid gap-3">
                      {records.map((record) => (
                        <div key={record.id} className="rounded-lg bg-ink-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <AttendanceBadge status={record.status} />
                            <span className="text-xs text-ink-500">{record.work_locations?.name ?? "-"}</span>
                          </div>
                          <div className="mt-3 grid gap-1 text-sm text-ink-700">
                            <span>حضور: {formatDateTime(record.check_in_time)}</span>
                            <span>انصراف: {formatDateTime(record.check_out_time)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title={dataLoading ? "جاري تحميل سجل اليوم" : "لا توجد سجلات لهذا اليوم"} className="min-h-32" />
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-bold text-ink-900">طلب جديد</h2>
              <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleRequestSubmit}>
                <Field label="نوع الطلب">
                  <Select value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)}>
                    <option value="absence">{requestTypeLabels.absence}</option>
                    <option value="leave">{requestTypeLabels.leave}</option>
                    <option value="correction">{requestTypeLabels.correction}</option>
                  </Select>
                </Field>

                <Field label="التاريخ">
                  <Input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} required />
                </Field>

                {requestType === "correction" ? (
                  <>
                    <Field label="الحالة الحالية">
                      <Select value={oldStatus} onChange={(event) => setOldStatus(event.target.value as AttendanceStatus)}>
                        <option value="absent">{attendanceStatusLabels.absent}</option>
                        <option value="late">{attendanceStatusLabels.late}</option>
                        <option value="present">{attendanceStatusLabels.present}</option>
                        <option value="leave">{attendanceStatusLabels.leave}</option>
                        <option value="early_leave">{attendanceStatusLabels.early_leave}</option>
                        <option value="incomplete">{attendanceStatusLabels.incomplete}</option>
                      </Select>
                    </Field>

                    <Field label="الحالة المطلوبة">
                      <Select value={newStatus} onChange={(event) => setNewStatus(event.target.value as AttendanceStatus)}>
                        <option value="present">{attendanceStatusLabels.present}</option>
                        <option value="late">{attendanceStatusLabels.late}</option>
                        <option value="leave">{attendanceStatusLabels.leave}</option>
                        <option value="early_leave">{attendanceStatusLabels.early_leave}</option>
                        <option value="incomplete">{attendanceStatusLabels.incomplete}</option>
                        <option value="absent">{attendanceStatusLabels.absent}</option>
                      </Select>
                    </Field>
                  </>
                ) : null}

                <Field label="السبب">
                  <Textarea className="md:col-span-2" value={reason} onChange={(event) => setReason(event.target.value)} required />
                </Field>

                {requestMessage ? (
                  <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm leading-6 text-ink-700 md:col-span-2">
                    {requestMessage}
                  </div>
                ) : null}

                <Button type="submit" disabled={requestSubmitting} className="md:justify-self-start">
                  <Send className="h-4 w-4" aria-hidden />
                  {requestSubmitting ? "جاري الإرسال" : "إرسال الطلب"}
                </Button>
              </form>
            </section>
          </div>

          <aside className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-ink-900">طلباتي</h2>
            {requests.length ? (
              <div className="mt-4 grid gap-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-ink-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink-900">{requestTypeLabels[request.request_type]}</p>
                        <p className="mt-1 text-sm text-ink-500">{formatDate(request.target_date)}</p>
                      </div>
                      <RequestBadge status={request.status} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-ink-700">{request.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={dataLoading ? "جاري تحميل الطلبات" : "لا توجد طلبات بعد"} className="mt-4" />
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

