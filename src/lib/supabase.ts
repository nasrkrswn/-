import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { hasSupabaseConfig } from "@/lib/config";

let browserClient: SupabaseClient | null | undefined;

export function getBrowserSupabase() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (browserClient === undefined) {
    browserClient = createClient();
  }

  return browserClient;
}
