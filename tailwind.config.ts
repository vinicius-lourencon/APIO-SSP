import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}", "./shared/**/*.ts"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "sisapa-green": "hsl(var(--sisapa-green))",
        "sisapa-action": "hsl(var(--sisapa-green-action))",
        "text-gray": "#5B6A61",
        // Paleta SISAPA: verde do IFMS + amarelo do ipê (símbolo do MS)
        mata: { DEFAULT: "#0E5A35", escuro: "#0A4428", claro: "#E3F1E8" },
        folha: { DEFAULT: "#2EA866", claro: "#DDF5E7" },
        ipe: { DEFAULT: "#F5B700", escuro: "#8A5A00", claro: "#FFF3CC" },
        tinta: "#14261C",
        apoio: "#56655C",
        fraco: "#87948C",
        fundo: "#EEF5EF",
        linha: "#DCE7DD",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["Figtree Variable", "system-ui", "sans-serif"],
        display: ["Bricolage Grotesque Variable", "Figtree Variable", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "blob-drift": {
          from: { transform: "translate3d(0, 0, 0) scale(1)" },
          to: { transform: "translate3d(4%, 6%, 0) scale(1.08)" },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "blob-drift": "blob-drift 32s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
