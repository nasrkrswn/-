"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  missingConfig: boolean;
  authIssue: string | null;
  profileIssue: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
}

function isSupabaseLockError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    message.includes("was released because another request stole it") ||
    message.includes("Navigator LockManager") ||
    message.includes("auth-token")
  );
}

function isProfileSchemaError(message: string) {
  return (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("profiles"))
  );
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

async function retryAuthOperation<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isSupabaseLockError(error)) {
        throw error;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  throw lastError;
}

function profileFallback(user: User): Profile {
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "مستخدم",
    email: user.email ?? null,
    role: "employee",
    department_id: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: null
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState<string | null>(null);
  const [profileIssue, setProfileIssue] = useState<string | null>(null);
  const missingConfig = !supabase;

  const loadProfile = useCallback(
    async (user: User | null) => {
      if (!supabase || !user) {
        setProfile(null);
        setProfileIssue(null);
        return;
      }

      try {
        const { data, error } = await withTimeout(
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          12000,
          "انتهت مهلة تحميل بيانات المستخدم من Supabase."
        );

        if (error || !data) {
          setProfile((currentProfile) => (currentProfile?.id === user.id ? currentProfile : profileFallback(user)));
          setProfileIssue(error && isProfileSchemaError(error.message) ? error.message : null);
          return;
        }

        setProfile(data as Profile);
        setProfileIssue(null);
      } catch (error) {
        setProfile((currentProfile) => (currentProfile?.id === user.id ? currentProfile : profileFallback(user)));
        const message = getErrorMessage(error);
        setProfileIssue(isProfileSchemaError(message) ? message : null);
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user ?? null);
  }, [loadProfile, session?.user]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let mounted = true;

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (isSupabaseLockError(event.reason)) {
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    async function loadInitialSession() {
      try {
        const { data, error } = await retryAuthOperation(() =>
          withTimeout(client.auth.getSession(), 12000, "انتهت مهلة تحميل جلسة الدخول من Supabase.")
        );

        if (!mounted) {
          return;
        }

        if (error) {
          setAuthIssue(error.message);
        } else {
          setAuthIssue(null);
        }

        setSession(data.session);
        await loadProfile(data.session?.user ?? null);
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (isSupabaseLockError(error)) {
          setAuthIssue(null);
          return;
        }

        setSession(null);
        setProfile(null);
        setAuthIssue(getErrorMessage(error));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialSession();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setAuthIssue(null);
        setSession(nextSession);
        await loadProfile(nextSession?.user ?? null);
      } catch (error) {
        if (!isSupabaseLockError(error)) {
          setAuthIssue(getErrorMessage(error));
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      missingConfig,
      authIssue,
      profileIssue,
      refreshProfile,
      signOut
    }),
    [session, profile, loading, missingConfig, authIssue, profileIssue, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
