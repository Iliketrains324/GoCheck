import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dlsu: {
          green: "#006B3C",
          "green-dark": "#004A28",
          "green-light": "#007C45",
          "green-muted": "#E8F5EE",
          gold: "#FFD700",
          "gold-dark": "#CCAC00",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "dlsu-pattern":
          "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,107,60,0.03) 10px, rgba(0,107,60,0.03) 20px)",
      },
    },
  },
  plugins: [],
};

export default config;
