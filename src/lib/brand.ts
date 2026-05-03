import { appConfig } from "@/lib/config";
import type { CSSProperties } from "react";

type BrandStyle = CSSProperties & {
  "--brand-primary"?: string;
  "--brand-primary-hover"?: string;
  "--brand-primary-active"?: string;
  "--luxury-gold"?: string;
  "--luxury-platinum"?: string;
};

export const brand = {
  name: appConfig.companyName || "حضورك",
  language: appConfig.appLanguage,
  logoUrl: appConfig.companyLogoUrl,
  primary: appConfig.brandPrimary || "#0f766e",
  
  // Modern attendance design system
  colors: {
    teal: "#0f766e",
    tealLight: "#14b8a6",
    tealSoft: "#ccfbf1",
    gold: "#d97706",
    goldLight: "#f59e0b",
    goldPale: "#fef3c7",
    platinum: "#e2e8f0",
    deepNavy: "#0f172a",
    charcoal: "#1e293b",
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      900: "#0f172a"
    }
  },
  
  // Typography - Arabic optimized
  typography: {
    fontFamily: {
      primary: "'Cairo', 'Segoe UI', system-ui, sans-serif",
      monospace: "'Courier Prime', ui-monospace, monospace"
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    }
  },
  
  // Symbolism - Letter interweaving (ح و ض)
  symbolism: {
    concept: "تداخل الحروف (ح و ض) يوحي بالاحتواء والاستقرار",
    letters: {
      haa: "ح",
      daal: "د",
      daad: "ض",
      dammah: "ـَ"
    }
  }
};

export const brandStyle: BrandStyle = {
  "--brand-primary": brand.primary,
  "--brand-primary-hover": "#115e59",
  "--brand-primary-active": "#134e4a",
  "--luxury-gold": brand.colors.gold,
  "--luxury-platinum": brand.colors.platinum
};
