import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['"Courier Prime"', 'ui-monospace', 'monospace'],
        brand: ['"Segoe UI"', '"Cairo"', 'system-ui', 'sans-serif']
      },
      colors: {
        // Balanced operational dashboard palette
        neutral: {
          50: "#f6f8fb",
          100: "#edf2f7",
          200: "#dbe4ef",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a"
        },
        luxury: {
          gold: "#d97706",
          "gold-light": "#f59e0b",
          "gold-pale": "#fef3c7",
          platinum: "#e2e8f0",
          "deep-navy": "#0f172a",
          charcoal: "#1e293b"
        },
        ink: {
          50: "#f5f7fb",
          100: "#e8eef5",
          200: "#d4deea",
          300: "#b6c5d8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1d2939",
          900: "#0f172a"
        },
        brand: {
          50: "#ecfdf7",
          100: "#d1fae9",
          200: "#9ee6d4",
          500: "#13a987",
          600: "#0f766e",
          700: "#0b5f59"
        },
        accent: {
          blue: "#2563eb",
          sky: "#0ea5e9",
          amber: "#d97706",
          rose: "#e11d48",
          violet: "#7c3aed"
        }
      },
      boxShadow: {
        soft: "0 10px 24px rgba(15, 23, 42, 0.07)",
        "soft-lg": "0 20px 45px rgba(15, 23, 42, 0.11)",
        luxury: "0 22px 42px rgba(15, 118, 110, 0.14), 0 10px 20px rgba(15, 23, 42, 0.07)"
      },
      spacing: {
        "luxury-xs": "0.5rem",
        "luxury-sm": "1rem",
        "luxury-md": "1.5rem",
        "luxury-lg": "2rem",
        "luxury-xl": "3rem"
      }
    }
  },
  plugins: []
};

export default config;
