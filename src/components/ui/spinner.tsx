import { cn } from "@/lib/cn";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-2 border-zinc-200 dark:border-zinc-800/80 border-t-zinc-950 dark:border-t-zinc-50 animate-spin size-4",
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
