import type { Config } from "tailwindcss";

/** Warna diambil dari variabel CSS di app/globals.css (format "R G B") agar modifier opasitas tetap berfungsi. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        sheet: token("sheet"),
        well: token("well"),
        line: {
          DEFAULT: token("line"),
          soft: token("line-soft"),
          strong: token("line-strong")
        },
        ink: {
          DEFAULT: token("ink"),
          2: token("ink-2"),
          3: token("ink-3")
        },
        cyan: {
          DEFAULT: token("cyan"),
          hover: token("cyan-hover"),
          soft: token("cyan-soft"),
          ink: token("cyan-ink")
        },
        violet: { DEFAULT: token("violet"), soft: token("violet-soft") },
        green: { DEFAULT: token("green"), soft: token("green-soft") },
        red: { DEFAULT: token("red"), soft: token("red-soft") },
        amber: { DEFAULT: token("amber"), soft: token("amber-soft") }
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-code)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.12em" }]
      },
      borderRadius: {
        sheet: "0.75rem"
      },
      boxShadow: {
        sheet: "0 1px 2px rgb(16 22 31 / 0.05), 0 1px 1px rgb(16 22 31 / 0.03)",
        lift: "0 10px 30px -12px rgb(16 22 31 / 0.22), 0 2px 6px rgb(16 22 31 / 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
