"use client";

import { cn } from "@/lib/cn";

type Role = "ct" | "ad";

type RoleSwitchFieldProps = {
  value: Role;
  onChange: (role: Role) => void;
  label?: string;
  description?: string;
  citizenText?: string;
  advocateText?: string;
  containerClassName?: string;
};

const ROLES = [
  { key: "ct" as Role, imageSrc: "/citizen.png" },
  { key: "ad" as Role, imageSrc: "/advocate.png" },
] as const;

export function RoleSwitchField({
  value,
  onChange,
  label,
  description: _description,
  citizenText = "Citizen",
  advocateText = "Advocate",
  containerClassName,
}: RoleSwitchFieldProps) {
  void _description;
  const labelMap: Record<Role, string> = {
    ct: citizenText,
    ad: advocateText,
  };

  return (
    <div className={cn("space-y-3", containerClassName)}>
      {label && (
        <div className="flex items-center gap-1.5 select-none">
          <label className="text-sm font-semibold text-foreground/90">
            {label}
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-1">
        {ROLES.map(({ key, imageSrc }) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "group flex flex-col items-center justify-center text-center",
                "rounded-2xl border-2 p-4 cursor-pointer select-none",
                "transition-all duration-300 transform active:scale-98 shadow-xs",
                isActive
                  ? "border-primary bg-white text-primary shadow-md shadow-blue-500/10 dark:bg-primary/10"
                  : "border-input bg-white text-muted-foreground hover:bg-slate-50/50 hover:border-input dark:bg-slate-900/30 dark:hover:bg-slate-800/20",
              )}
            >
              {}
              <div className="h-20 w-20 sm:h-24 sm:w-24 mb-3 flex items-center justify-center bg-transparent border border-transparent shadow-none rounded-2xl dark:bg-slate-800/40 dark:border-slate-800 p-2 transition-transform duration-300 group-hover:scale-105">
                <img
                  src={imageSrc}
                  alt={labelMap[key]}
                  className="h-full w-full object-contain shrink-0 rounded-xl"
                />
              </div>
              <span className="text-sm font-semibold tracking-wide">
                {labelMap[key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
