import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SignupPayload = {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const employeeEmailDomain = (process.env.NEXT_PUBLIC_EMPLOYEE_EMAIL_DOMAIN ?? "").trim().toLowerCase().replace(/^@/, "");

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAllowedEmployeeEmail(email: string) {
  if (!employeeEmailDomain) {
    return true;
  }

  return email.endsWith(`@${employeeEmailDomain}`);
}

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: Request) {
  const admin = getAdminClient();

  if (!admin) {
    return jsonError("إعدادات Supabase غير مكتملة على السيرفر.", 500);
  }

  let payload: SignupPayload;

  try {
    payload = (await request.json()) as SignupPayload;
  } catch {
    return jsonError("بيانات إنشاء الحساب غير صالحة.");
  }

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!fullName) {
    return jsonError("اكتب اسم الموظف قبل إنشاء الحساب.");
  }

  if (!isValidEmail(email)) {
    return jsonError("اكتب بريدًا إلكترونيًا صحيحًا.");
  }

  if (!isAllowedEmployeeEmail(email)) {
    return jsonError(`هذا البريد غير مسموح له بإنشاء حساب. استخدم بريد الشركة بدومين ${employeeEmailDomain}.`);
  }

  if (password.length < 6) {
    return jsonError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "employee"
    }
  });

  if (error || !data.user) {
    const message = error?.message.toLowerCase() ?? "";

    if (message.includes("already registered") || message.includes("already been registered") || message.includes("already exists")) {
      return jsonError("هذا البريد مسجل بالفعل. استخدم تبويب دخول بنفس البريد وكلمة المرور.", 409);
    }

    return jsonError(error?.message ?? "تعذر إنشاء حساب الموظف في Supabase.", 500);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullName,
      email,
      role: "employee",
      active: true
    },
    { onConflict: "id" }
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return jsonError(profileError.message, 500);
  }

  return NextResponse.json({
    userId: data.user.id,
    email
  });
}
