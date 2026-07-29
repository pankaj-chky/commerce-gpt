import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          muted: "var(--color-primary-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
          elevated: "var(--color-surface-elevated)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-fg)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
        sidebar: "var(--color-sidebar)",
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FAFAF8",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        "hero": ["56px", { lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.02em" }],
        "heading": ["28px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        "card-title": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "caption": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label": ["12px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
        "full": "9999px",
      },
      boxShadow: {
        "card": "0 0 0 1px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "card-hover": "0 0 0 1px rgba(44,142,140,0.15), 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
        "input": "0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        "input-focus": "0 0 0 2px rgba(44,142,140,0.2), 0 2px 12px rgba(44,142,140,0.08)",
        "button": "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.06)",
        "button-hover": "0 0 0 1px rgba(44,142,140,0.2), 0 2px 8px rgba(44,142,140,0.12)",
        "elevated": "0 0 0 1px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.03)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up-delayed": "fadeUp 0.6s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-right": "slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "stagger-1": "fadeUp 0.5s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "stagger-2": "fadeUp 0.5s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
        "stagger-3": "fadeUp 0.5s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "stagger-4": "fadeUp 0.5s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "stagger-5": "fadeUp 0.5s 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "stagger-6": "fadeUp 0.5s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "chart-scroll": "chartScroll 120s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        chartScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.15" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;