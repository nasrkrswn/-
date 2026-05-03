export const appConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "",
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "حضورك",
  appLanguage: process.env.NEXT_PUBLIC_APP_LANGUAGE ?? "ar",
  brandPrimary: process.env.NEXT_PUBLIC_BRAND_PRIMARY ?? "#0f766e",
  companyLogoUrl: process.env.NEXT_PUBLIC_COMPANY_LOGO_URL ?? "",
  employeeEmailDomain: process.env.NEXT_PUBLIC_EMPLOYEE_EMAIL_DOMAIN ?? ""
};

export function hasSupabaseConfig() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabasePublishableKey);
}
