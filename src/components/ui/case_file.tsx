"use client";

import type * as React from "react";

export const SectionHeader = ({
  label,
  icon: Icon,
  actions,
}: {
  label: string;
  icon: React.ElementType;
  actions?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/60">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
};
