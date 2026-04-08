/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bengali: ['"Hind Siliguri"', '"Noto Sans Bengali"', "sans-serif"],
        ui: ['"Hind Siliguri"', '"Noto Sans Bengali"', "sans-serif"],
        display: ['"Tiro Bangla"', '"Noto Serif Bengali"', "serif"]
      },
      colors: {
        brand: {
          50: "#f3f6fb",
          100: "#dde7f4",
          200: "#bccde4",
          300: "#91add1",
          400: "#6389b9",
          500: "#476d9f",
          600: "#345887",
          700: "#29476f",
          800: "#223a59",
          900: "#1a2d45"
        },
        accent: {
          50: "#fbf1e8",
          100: "#f4ddc8",
          200: "#ebc49f",
          300: "#dea26d",
          400: "#d18446",
          500: "#c46d33",
          600: "#ab5728",
          700: "#8d4322",
          800: "#71361f",
          900: "#5d2d1d"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(18, 40, 74, 0.12)",
        paper: "0 22px 55px rgba(33, 45, 73, 0.12)",
        glow: "0 16px 35px rgba(171, 87, 40, 0.16)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(52, 88, 135, 0.18), transparent 34%), radial-gradient(circle at 80% 20%, rgba(196, 109, 51, 0.12), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.9), rgba(244,237,226,0.72))",
        "paper-grain":
          "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(247,241,232,0.82))"
      }
    }
  },
  plugins: []
};
