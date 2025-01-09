import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Világos téma színei
        primary: {
          DEFAULT: "#1a56db",
          dark: "#1e429f",
          light: "#60a5fa",
        },
        background: {
          DEFAULT: "#ffffff",
          dark: "#f3f4f6",
        },
        text: {
          DEFAULT: "#111827",
          light: "#374151",
        },
        // Sötét téma színei
        dark: {
          primary: {
            DEFAULT: "#60a5fa",
            dark: "#3b82f6",
            light: "#93c5fd",
          },
          background: {
            DEFAULT: "#111827",
            dark: "#1f2937",
          },
          text: {
            DEFAULT: "#f9fafb",
            light: "#e5e7eb",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
