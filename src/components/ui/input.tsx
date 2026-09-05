import { cn } from "@/lib/cn";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground autofill:shadow-[inset_0_0_0px_1000px_hsl(var(--card))] autofill:[-webkit-text-fill-color:hsl(var(--foreground))] autofill:rounded-lg autofill:bg-clip-padding focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-[15px] dark:bg-zinc-900/50 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
