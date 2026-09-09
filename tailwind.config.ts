import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface
        cream: "#F5F1E8",
        paper: "#FFFDF8",
        ink: "#1A1714",
        bone: "#FAF6EE",

        // Accents (from mockup)
        coral: "#FF6B4A",
        violet: "#7C5CFF",
        amber: "#FFB627",
        mint: "#3DD68C",
        sky: "#2D7BF4",
        rust: "#C2410C",
        rose: "#EC4899",

        // Semantic
        success: "#15803D",
        warning: "#C2410C",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
      },
      borderRadius: {
        card: "22px",
        bubble: "28px",
        hero: "32px",
      },
      boxShadow: {
        sheet: "0 -8px 32px rgba(26, 23, 20, 0.08)",
        pop: "0 20px 60px rgba(26, 23, 20, 0.25)",
      },
      backgroundImage: {
        "warm-radial":
          "radial-gradient(ellipse at 20% 10%, #FFE4B533 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, #FFD0B833 0%, transparent 50%)",
      },
      keyframes: {
        "slide-up-fade": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(700px) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "slide-up-fade": "slide-up-fade 0.34s cubic-bezier(0.32, 0.72, 0.3, 1)",
        "pop-in": "pop-in 0.4s cubic-bezier(0.32, 1.4, 0.4, 1)",
        "confetti-fall": "confetti-fall 1.6s ease-in forwards",
      },
    },
  },
  plugins: [],
};

export default config;
