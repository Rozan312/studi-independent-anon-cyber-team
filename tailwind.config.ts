import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
          strong: token("line-strong"),
          input: token("line-input")
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
        amber: { DEFAULT: token("amber"), soft: token("amber-soft") },
        tile: {
          indigo: token("tile-indigo"),
          "indigo-ink": token("tile-indigo-ink"),
          teal: token("tile-teal"),
          "teal-ink": token("tile-teal-ink")
        }
      },
      fontFamily: {
        sans: ["var(--font-text)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-code)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }]
      },
      borderRadius: {
        sheet: "0.625rem"
      },
      boxShadow: {
        // Panel rata tanpa bayangan; nama tetap ada agar kelas lama tidak rusak.
        sheet: "0 0 #0000",
        lift: "0 24px 48px -16px rgb(0 0 0 / 0.55)"
      }
    }
  },
  plugins: [
    // `coarse:` untuk perangkat sentuh: target sentuh 44 px tanpa mengubah tampilan desktop bermouse.
    plugin(({ addVariant }) => {
      addVariant("coarse", "@media (pointer: coarse)");
    })
  ]
};

export default config;
