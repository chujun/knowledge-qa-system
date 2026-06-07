import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2522",
        paper: "#f5f0e7",
        moss: "#51624b",
        clay: "#c85f3f",
        brass: "#b7954d",
        fog: "#d8d5c9"
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        body: ["ui-serif", "Georgia", "serif"]
      },
      boxShadow: {
        line: "0 1px 0 rgba(31, 37, 34, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
