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
        cream: {
          50: "#FCFAF6",
          100: "#F8F5EE",
          200: "#F2EDE1",
          300: "#E6DFCF",
          400: "#D8CEB8",
          500: "#C6B99E",
        },
        forest: {
          50: "#F0F5F2",
          100: "#DCE7E1",
          200: "#B8D0C3",
          300: "#8FB4A1",
          400: "#60937A",
          500: "#3D755B",
          600: "#2B5A44",
          700: "#224736",
          800: "#1A3629",
          900: "#12251C",
          950: "#0A1711",
        },
        ochre: {
          50: "#FBF7EE",
          100: "#F6EED5",
          200: "#ECDBA8",
          300: "#DFC377",
          400: "#D4AB4C",
          500: "#C09335",
          600: "#9E7326",
          700: "#785320",
          800: "#62431F",
          900: "#53391E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(18, 37, 28, 0.04), 0 1px 2px -1px rgba(18, 37, 28, 0.04)",
        cardHover: "0 10px 25px -5px rgba(18, 37, 28, 0.08), 0 8px 10px -6px rgba(18, 37, 28, 0.04)",
        glow: "0 0 20px -3px rgba(212, 171, 76, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
