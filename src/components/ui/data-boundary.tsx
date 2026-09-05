import { cn } from "@/lib/cn";
import { AlertCircle, Inbox, RefreshCw, ServerCrash } from "lucide-react";
import { Button } from "./button";

interface DataBoundaryProps {
  isError?: boolean;
  data?: unknown;
  errorMessage?: string;
  emptyMessage?: string;
  errorTitle?: string;
  emptyTitle?: string;
  onRefetch?: () => void;
  refetchLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function DataBoundary({
  isError,
  data,
  errorMessage = "Please try again later or contact support if the problem persists.",
  emptyMessage = "There's nothing here yet.",
  errorTitle = "Something went wrong",
  emptyTitle = "No data found",
  onRefetch,
  refetchLabel = "Try again",
  className,
  children,
}: DataBoundaryProps) {

  if (isError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-20 px-6 text-center",
          className,
        )}
      >
        <div className="relative mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
            <ServerCrash className="h-6 w-6 text-destructive" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive ring-2 ring-background" />
          </span>
        </div>

        <div className="max-w-xs space-y-1">
          <p className="text-sm font-semibold text-foreground">{errorTitle}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {errorMessage}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1">
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span className="text-xs font-medium text-destructive">Error</span>
          </div>

          {onRefetch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              className="h-7 gap-1.5 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              {refetchLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }


  const isEmpty =
    data == null ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === "object" &&
      !Array.isArray(data) &&
      Object.keys(data).length === 0);

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-20 px-6 text-center",
          className,
        )}
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="max-w-xs space-y-1">
          <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {emptyMessage}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            <span className="text-xs font-medium text-muted-foreground">
              Empty
            </span>
          </div>

          {onRefetch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              className="h-7 gap-1.5 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              {refetchLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }


  return <>{children}</>;
}
