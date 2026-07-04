import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

// Wraps a CSS variable holding an "R G B" triplet so Tailwind's opacity
// modifiers (e.g. text-white/40, bg-bg-card/60) keep working exactly as
// before, but the underlying color now flips with the active theme. This
// is what lets the whole app (hundreds of existing text-white/NN,
// border-white/NN, bg-bg-card/NN classes) respond to the Settings ->
// Appearance toggle without editing every component file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withOpacity(variable: string): any {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) return `rgb(var(${variable}))`;
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
}

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        white: withOpacity("--color-fg-rgb"),
        bg: {
          DEFAULT: withOpacity("--color-bg-rgb"),
          panel: withOpacity("--color-bg-panel-rgb"),
          card: withOpacity("--color-bg-card-rgb"),
          hover: withOpacity("--color-bg-hover-rgb"),
        },
        accent: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          dark: "#7c3aed",
        },
        risk: {
          high: "#f43f5e",
          medium: "#f59e0b",
          low: "#22c55e",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(139,92,246,0.45)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)",
        "headline-gradient": "linear-gradient(90deg, #a78bfa 0%, #8b5cf6 50%, #d946ef 100%)",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": {
          "--color-fg-rgb": "255 255 255",
          "--color-bg-rgb": "5 5 11",
          "--color-bg-panel-rgb": "13 13 22",
          "--color-bg-card-rgb": "16 16 27",
          "--color-bg-hover-rgb": "21 21 31",
          "--color-track-rgb": "255 255 255",
        },
        "html.light": {
          "--color-fg-rgb": "15 15 23",
          "--color-bg-rgb": "247 247 251",
          "--color-bg-panel-rgb": "255 255 255",
          "--color-bg-card-rgb": "255 255 255",
          "--color-bg-hover-rgb": "240 240 245",
          "--color-track-rgb": "10 10 20",
        },
      });
    }),
  ],
};

export default config;
