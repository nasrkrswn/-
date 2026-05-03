import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { MetaPixel } from "@/components/meta-pixel";
import { brand, brandStyle } from "@/lib/brand";

export const metadata: Metadata = {
  title: brand.name,
  description: "نظام حضور وانصراف للشركات"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={brand.language} dir="rtl">
      <body style={brandStyle}>
        <MetaPixel />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
