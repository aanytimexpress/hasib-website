import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className = "" }: AdminCardProps) {
  return (
    <section className={`rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-paper backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}
