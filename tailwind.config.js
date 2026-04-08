/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bengali: ['"Hind Siliguri"', '"Noto Sans Bengali"', "sans-serif"],
        ui: ['"Noto Sans Bengali"', '"Hind Siliguri"', "sans-serif"]
      },
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#dbeefd",
          200: "#c0e2fb",
          300: "#94d2f8",
          400: "#60b8f1",
          500: "#3b9be8",
          600: "#2680da",
          700: "#2067c2",
          800: "#2155a0",
          900: "#214a7d"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(18, 40, 74, 0.12)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 40%), radial-gradient(circle at 80% 20%, rgba(13, 148, 136, 0.14), transparent 40%)"
      }
    }
  },
  plugins: []
};
