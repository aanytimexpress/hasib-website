import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className = "" }: AdminCardProps) {
  return <section className={`rounded-xl bg-white p-4 shadow-panel ${className}`}>{children}</section>;
}
