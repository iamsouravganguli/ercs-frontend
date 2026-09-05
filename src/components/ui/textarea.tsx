import { cn } from "@/lib/cn";
import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 focus-within:bg-white px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground autofill:shadow-[inset_0_0_0px_1000px_hsl(var(--card))] autofill:[-webkit-text-fill-color:hsl(var(--foreground))] autofill:rounded-lg autofill:bg-clip-padding focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-[15px] dark:bg-zinc-900/50 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 wrap-break-word break-all",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
