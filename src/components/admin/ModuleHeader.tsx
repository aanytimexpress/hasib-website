import { ReactNode } from "react";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function ModuleHeader({ title, description, actions }: ModuleHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-paper backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-display text-2xl text-slate-900">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
