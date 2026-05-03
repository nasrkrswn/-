/**
 * نظام الألوان والثيمات
 * Color & Theme System for a modern attendance dashboard
 */

export const colorSystem = {
  // Primary Palette
  primary: {
    teal: "#0f766e",
    tealLight: "#14b8a6",
    tealPale: "#ccfbf1",
    tealDark: "#115e59",
    tealDarker: "#134e4a"
  },

  // Secondary Neutral Palette
  neutral: {
    50: "#f8fafc",   // Primary background
    100: "#f1f5f9",  // Light background
    200: "#e2e8f0",  // Light borders
    300: "#cbd5e1",  // Subtle dividers
    400: "#94a3b8",  // Muted text
    500: "#64748b",  // Medium text
    600: "#475569",  // Strong text
    700: "#334155",  // Dark text
    800: "#1e293b",  // Very dark
    900: "#0f172a"   // Primary text
  },

  // Accent Colors
  luxury: {
    gold: "#d97706",
    goldLight: "#f59e0b",
    goldPale: "#fef3c7",
    platinum: "#e2e8f0",
    deepNavy: "#0f172a",
    charcoal: "#1e293b",
    darkSilver: "#64748b"
  },

  // Semantic Colors
  semantic: {
    success: "#059669",    // Green for check-ins
    warning: "#d97706",    // Amber for late arrivals
    error: "#dc2626",      // Red for absences
    info: "#0284c7"        // Blue for information
  },

  // Status Colors
  status: {
    present: {
      light: "#ecfdf5",
      main: "#10b981",
      dark: "#047857"
    },
    late: {
      light: "#fef3c7",
      main: "#f59e0b",
      dark: "#d97706"
    },
    absent: {
      light: "#fee2e2",
      main: "#ef4444",
      dark: "#dc2626"
    },
    pending: {
      light: "#eff6ff",
      main: "#3b82f6",
      dark: "#1d4ed8"
    }
  }
};

export const themeConfig = {
  light: {
    background: {
      primary: "#f8fafc",
      secondary: "#f1f5f9",
      tertiary: "#e2e8f0"
    },
    text: {
      primary: "#0f172a",
      secondary: "#334155",
      tertiary: "#64748b",
      muted: "#94a3b8"
    },
    border: {
      light: "#e2e8f0",
      medium: "#cbd5e1",
      dark: "#94a3b8"
    },
    interactive: {
      primary: "#0f766e",
      primaryHover: "#115e59",
      primaryActive: "#134e4a",
      secondary: "#1e293b",
      secondaryHover: "#334155",
      focus: "rgba(15, 118, 110, 0.18)"
    },
    shadow: {
      sm: "0 1px 2px rgba(15, 23, 42, 0.05)",
      base: "0 4px 14px rgba(15, 23, 42, 0.06)",
      md: "0 14px 30px rgba(15, 23, 42, 0.09)",
      lg: "0 20px 36px rgba(15, 118, 110, 0.12), 0 10px 18px rgba(15, 23, 42, 0.06)"
    }
  }
};

export const tokenMap = {
  // Color Tokens for Figma/Design Systems
  colorTokens: {
    "brand/teal": colorSystem.primary.teal,
    "brand/teal-light": colorSystem.primary.tealLight,
    "brand/teal-pale": colorSystem.primary.tealPale,
    "brand/gold": colorSystem.luxury.gold,
    "brand/gold-light": colorSystem.luxury.goldLight,
    "brand/gold-pale": colorSystem.luxury.goldPale,
    "brand/platinum": colorSystem.luxury.platinum,
    "brand/charcoal": colorSystem.luxury.charcoal,

    "neutral/50": colorSystem.neutral[50],
    "neutral/100": colorSystem.neutral[100],
    "neutral/200": colorSystem.neutral[200],
    "neutral/300": colorSystem.neutral[300],
    "neutral/400": colorSystem.neutral[400],
    "neutral/500": colorSystem.neutral[500],
    "neutral/600": colorSystem.neutral[600],
    "neutral/700": colorSystem.neutral[700],
    "neutral/800": colorSystem.neutral[800],
    "neutral/900": colorSystem.neutral[900],

    "status/success": colorSystem.status.present.main,
    "status/warning": colorSystem.status.late.main,
    "status/error": colorSystem.status.absent.main,
    "status/info": colorSystem.status.pending.main
  },

  // Shadow Tokens
  shadowTokens: {
    "shadow/sm": themeConfig.light.shadow.sm,
    "shadow/base": themeConfig.light.shadow.base,
    "shadow/md": themeConfig.light.shadow.md,
    "shadow/lg": themeConfig.light.shadow.lg
  },

  // Typography Tokens
  typographyTokens: {
    "font/family/primary": "'Cairo', 'Segoe UI', system-ui, sans-serif",
    "font/family/monospace": "'Courier Prime', ui-monospace, monospace",
    "font/weight/light": 300,
    "font/weight/normal": 400,
    "font/weight/medium": 500,
    "font/weight/semibold": 600,
    "font/weight/bold": 700,
    "font/weight/extrabold": 800
  }
};

export const contrastRatios = {
  // WCAG Compliance
  tealOnWhite: "5.4:1",
  charcoalOnWhite: "14.6:1",
  whiteOnTeal: "5.4:1",
  whiteOnCharcoal: "14.6:1"
};

export const paletteExport = {
  // Tailwind CSS Configuration
  tailwindColors: {
    brand: {
      50: "#f0fdfa",
      100: "#ccfbf1",
      500: "#14b8a6",
      600: "#0f766e",
      700: "#115e59"
    },
    luxury: {
      gold: "#d97706",
      "gold-light": "#f59e0b",
      platinum: "#e2e8f0",
      "deep-navy": "#0f172a",
      charcoal: "#1e293b"
    }
  }
};
