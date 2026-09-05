import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  title: string;
  className?: string;
};

export function SectionHeading({ title, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h2 className="text-base font-semibold text-foreground whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
