import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        surface: "#111827",
        panel: "#171b26",
        raised: "#1c2230",
        border: "#303642",
        muted: "#8f9aad",
        primary: "#4d8eff",
        secondary: "#8b5cf6",
        success: "#4edea3",
        warning: "#f8c555",
        danger: "#ff6b6b"
      }
    }
  },
  plugins: []
};

export default config;
