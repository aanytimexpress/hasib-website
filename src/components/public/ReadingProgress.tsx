import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const value = (window.scrollY / total) * 100;
      setProgress(Math.min(100, Math.max(0, value)));
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-[69px] z-20 h-1 w-full bg-slate-200">
      <div className="h-full bg-brand-700 transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}
