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
      className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/85 px-4 py-2 text-sm text-brand-800 transition hover:border-accent-300 hover:bg-white"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      {isDark ? "আলো" : "গাঢ়"}
    </button>
  );
}
