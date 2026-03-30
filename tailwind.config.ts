import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        neon: {
          cyan: "#00f5ff",
          purple: "#b347ff",
          green: "#39ff14",
          pink: "#ff2d78",
        },
        tier: {
          free: "#94a3b8",
          gold: "#facc15",
          premium: "#c084fc",
        },
      },
      boxShadow: {
        neon: "0 0 8px #00f5ff, 0 0 20px #00f5ff33",
        "neon-purple": "0 0 8px #b347ff, 0 0 20px #b347ff33",
        "neon-pink": "0 0 8px #ff2d78, 0 0 20px #ff2d7833",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        glow: "glow 1.5s ease-in-out infinite alternate",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "slide-up": {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          from: { textShadow: "0 0 4px #00f5ff, 0 0 8px #00f5ff" },
          to: {
            textShadow:
              "0 0 8px #00f5ff, 0 0 24px #00f5ff, 0 0 48px #00f5ff55",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
