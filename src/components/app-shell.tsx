"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  FileBarChart,
  FileCheck2,
  FolderKanban,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Users,
  X
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth-provider";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { roleLabels } from "@/lib/labels";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/app/history", label: "سجل الحضور", icon: CalendarClock, roles: ["manager", "admin"] },
  { href: "/app/requests", label: "إدارة الطلبات", icon: FileCheck2, roles: ["manager", "admin"] },
  { href: "/app/dashboard", label: "لوحة التحكم", icon: BarChart3, roles: ["manager", "admin"] },
  { href: "/app/reports", label: "التقارير", icon: FileBarChart, roles: ["manager", "admin"] },
  { href: "/app/admin/employees", label: "الموظفون", icon: Users, roles: ["manager", "admin"] },
  { href: "/app/admin/departments", label: "الأقسام", icon: FolderKanban, roles: ["manager", "admin"] },
  { href: "/app/admin/shifts", label: "الورديات", icon: Building2, roles: ["manager", "admin"] },
  { href: "/app/admin/locations", label: "تغيير الموقع", icon: MapPin, roles: ["manager", "admin"] },
  { href: "/app/settings", label: "الإعدادات", icon: Settings, roles: ["manager", "admin"] }
];

function isAllowed(role: UserRole | undefined, item: NavItem) {
  if (!item.roles) {
    return true;
  }

  return role ? item.roles.includes(role) : false;
}

function LoadingScreen({ message = "جاري تحميل النظام" }: { message?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50">
      <div className="rounded-lg border border-ink-200 bg-white px-6 py-4 text-sm font-semibold text-ink-700 shadow-soft">
        {message}
      </div>
    </div>
  );
}

function AuthIssueScreen({ message, onLogin }: { message: string; onLogin: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
      <div className="w-full max-w-xl rounded-lg border border-amber-200 bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-semibold text-amber-700">تعذر تحميل جلسة الدخول</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">النظام موجود، لكن جلسة المتصفح تحتاج إعادة تحميل</h1>
        <p className="mt-3 text-sm leading-7 text-ink-600">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          <Button variant="outline" onClick={onLogin}>العودة لتسجيل الدخول</Button>
        </div>
      </div>
    </div>
  );
}

function isSchemaSetupIssue(message: string | null) {
  if (!message) {
    return false;
  }

  return (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("relation") && message.includes("profiles")
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, missingConfig, authIssue, profileIssue, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isControlUser = profile?.role === "manager" || profile?.role === "admin";

  useEffect(() => {
    if (!loading && !missingConfig && !user && !authIssue) {
      router.replace("/login");
    }
  }, [authIssue, loading, missingConfig, router, user]);

  useEffect(() => {
    if (!loading && !missingConfig && user && profile && !profileIssue && !isControlUser) {
      router.replace("/employees");
    }
  }, [isControlUser, loading, missingConfig, profile, profileIssue, router, user]);

  if (missingConfig) {
    return <SetupNotice />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (authIssue && !user) {
    return <AuthIssueScreen message={authIssue} onLogin={() => router.replace("/login")} />;
  }

  if (!user) {
    return <LoadingScreen message="جاري تحويلك إلى تسجيل الدخول" />;
  }

  if (profile && !profileIssue && !isControlUser) {
    return <LoadingScreen message="جاري تحويلك إلى صفحة الموظفين" />;
  }

  const visibleItems = navItems.filter((item) => isAllowed(profile?.role, item));

  const sidebar = (
    <aside className="flex h-full flex-col border-l border-white/10 bg-ink-900 text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/app/dashboard" className="min-w-0">
          <BrandLogo tone="light" size="sm" />
        </Link>
        <button
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="إغلاق القائمة"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <nav className="grid flex-1 content-start gap-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                active ? "bg-emerald-500/20 text-white ring-1 ring-emerald-300/20" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 grid gap-1">
          <p className="truncate text-sm font-bold text-white">{profile?.full_name ?? user.email}</p>
          <p className="text-xs font-medium text-slate-300">{profile?.role ? roleLabels[profile.role] : "موظف"}</p>
        </div>
        <Button
          variant="outline"
          className="w-full border-white/10 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white"
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          خروج
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-200 bg-white px-4 lg:hidden">
        <button
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <Link href="/app/dashboard" className="min-w-0">
          <BrandLogo size="sm" showSubtitle={false} />
        </Link>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr]">
        <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
        <main className="min-w-0 px-4 py-6 md:px-8 lg:px-10">
          {isSchemaSetupIssue(profileIssue) ? (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
              لا يمكن الوصول إلى جدول <span className="font-mono">profiles</span>. غالبًا لم يتم تنفيذ ملف
              <span className="font-mono"> supabase/migrations/001_initial_schema.sql </span>
              في Supabase بعد.
            </div>
          ) : null}
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-ink-900/40"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[min(86vw,320px)] shadow-soft">{sidebar}</div>
        </div>
      ) : null}
    </div>
  );
}
