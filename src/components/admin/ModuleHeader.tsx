import { ReactNode } from "react";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function ModuleHeader({ title, description, actions }: ModuleHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-panel md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
