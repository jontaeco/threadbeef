import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0c",
        surface: {
          DEFAULT: "#131318",
          2: "#1a1a22",
        },
        border: "#2a2a35",
        text: {
          DEFAULT: "#e8e6f0",
          muted: "#7a7890",
        },
        accent: {
          DEFAULT: "#ff4d4d",
          glow: "rgba(255, 77, 77, 0.15)",
        },
        blue: {
          DEFAULT: "#4d9fff",
          glow: "rgba(77, 159, 255, 0.15)",
        },
        green: "#34d399",
        yellow: "#fbbf24",
        "user-a": "#ff6b6b",
        "user-b": "#6ba3ff",
      },
      borderRadius: {
        card: "12px",
        thread: "16px",
        pill: "100px",
      },
      fontFamily: {
        mono: ["Space Mono", "monospace"],
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        sizzle: {
          "0%, 100%": { transform: "rotate(-5deg) scale(1)" },
          "50%": { transform: "rotate(5deg) scale(1.1)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease",
        "fade-in-down": "fadeInDown 0.5s ease",
        "fade-in": "fadeIn 0.4s ease",
        "slide-in": "slideIn 0.4s ease",
        sizzle: "sizzle 2s ease-in-out infinite",
        spin: "spin 0.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
