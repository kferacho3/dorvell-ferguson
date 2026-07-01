import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        df: {
          brown: {
            950: "#2b1c18",
            850: "#3a251f",
            700: "#4a2f27",
            600: "#5a3a2e",
          },
          teal: {
            800: "#0e625e",
            700: "#176f6a",
            600: "#1b7f7a",
            400: "#37b4ac",
          },
          cream: {
            100: "#f6efe4",
            200: "#eadbc8",
          },
          taupe: "#c8a58c",
          charcoal: "#161311",
          ink: "#221f1d",
          paper: "#fbf7ef",
          muted: "#7a7068",
        },
      },
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lens: "0 28px 70px rgba(43, 28, 24, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
