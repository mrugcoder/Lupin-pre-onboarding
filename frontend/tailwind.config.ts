import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        // Brand palette — deep navy + teal accent
        brand: {
          950: "#050d1a",
          900: "#0a1628",
          800: "#0f2040",
          700: "#162d58",
          600: "#1e3e78",
          500: "#2954a3",
          400: "#3d6bbf",
          300: "#6b96d6",
          200: "#a8c1e8",
          100: "#d4e3f5",
          50:  "#eaf1fb",
        },
        accent: {
          600: "#0d9488",
          500: "#14b8a6",
          400: "#2dd4bf",
          300: "#5eead4",
        },
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #050d1a 0%, #0f2040 50%, #162d58 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #14b8a6 0%, #2954a3 100%)",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.3)",
        "glow-accent": "0 0 20px rgba(20, 184, 166, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      opacity: {
        "3": "0.03",
        "8": "0.08",
      },
    },
  },
  plugins: [],
};

export default config;
