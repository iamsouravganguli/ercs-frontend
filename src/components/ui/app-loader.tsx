import Image from "next/image";

import { cn } from "@/lib/cn";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";

type FullscreenPhase = "connecting" | "done";

interface AppLoaderProps {
  variant?: "fullscreen" | "overlay" | "bar" | "inline" | "skeleton";
  phase?: FullscreenPhase;
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}


export function AppLoader({
  variant = "fullscreen",
  phase = "connecting",
  text,
  className,
  size = "md",
}: AppLoaderProps) {
  if (variant === "bar") {
    return (
      <div
        role="status"
        aria-label="Loading"
        className={cn("h-1 w-full bg-primary/20 overflow-hidden", className)}
      >
        <div className="h-full w-full bg-primary/60 animate-pulse" />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Spinner
          className={cn(
            size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-4",
          )}
        />
        {text ? (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        ) : null}
      </span>
    );
  }

  if (variant === "skeleton") {
    return <Skeleton className={className} />;
  }

  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/15 dark:bg-black/40 backdrop-blur-[2px]",
          className,
        )}
      >
        <div className="flex items-center justify-center p-3 rounded-xl bg-background/90 dark:bg-zinc-900/90 border border-border/50 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <Spinner className="h-6 w-6 border-t-zinc-950 dark:border-t-white" />
          {text ? (
            <span className="ml-2 text-sm text-muted-foreground">{text}</span>
          ) : null}
        </div>
      </div>
    );
  }


  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background select-none",
        className,
      )}
    >
      <div className="relative flex items-center justify-center h-16 w-16 animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute inset-0 rounded-full border-[2px] border-slate-100 dark:border-slate-900/60" />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[2px] border-transparent transition-all duration-500",
            phase === "done"
              ? "border-emerald-500 dark:border-emerald-400 animate-none"
              : "border-t-blue-600 dark:border-t-blue-500 animate-spin",
          )}
          style={{ animationDuration: "800ms" }}
        />
        <Image
          src="/logo.png"
          alt="Uttarakhand State Emblem"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          priority
        />
      </div>
      {text ? (
        <span className="absolute mt-24 text-xs tracking-widest text-muted-foreground animate-pulse">
          {text}
        </span>
      ) : null}
    </div>
  );
}


export const LoadingDotsTCX = (props: Omit<AppLoaderProps, "variant">) => (
  <AppLoader variant="fullscreen" {...props} />
);


export const TableBarLoader = () => <AppLoader variant="bar" />;
export const InlineLoader = ({ text }: { text?: string }) => (
  <AppLoader variant="inline" text={text} />
);
export const OverlayLoader = ({ text }: { text?: string }) => (
  <AppLoader variant="overlay" text={text} />
);
