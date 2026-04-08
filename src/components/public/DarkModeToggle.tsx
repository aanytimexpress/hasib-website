import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(localStorage.getItem("public_dark") === "true");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("public_dark", String(isDark));
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((value) => !value)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
