import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#FFFFFF",
        mist: "#F4F4F4",
        line: "#E9E9E9",
        muted: "#6B6B6B"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"]
      },
      boxShadow: {
        lift: "0 8px 24px rgba(10,10,10,0.06)"
      }
    }
  },
  plugins: []
};

export default config;
