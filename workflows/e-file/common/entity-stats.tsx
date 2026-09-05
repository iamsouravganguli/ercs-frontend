"use client";
export type StatItem = { label: string; value: string | number; sub?: string };

export function EntityStats({ stats, className }: { stats: StatItem[]; className?: string }) {
  const cols = stats.length === 3 ? "md:grid-cols-3" : stats.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
  return (
    <div className={className ?? `grid grid-cols-1 ${cols} gap-4`}>
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground capitalize tracking-normal">{s.label}</p>
            <p className="text-2xl font-semibold mt-0.5 text-foreground">{s.value}</p>
            {s.sub && <p className="text-[10px] text-amber-600 font-medium">{s.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
