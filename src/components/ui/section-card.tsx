"use client";
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import {
  Pencil,
  Info,
  AlertTriangle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

type FooterVariant = "info" | "warning" | "danger";

interface FooterStyle {
  wrapper: string;
  icon: string;
  Icon: LucideIcon;
}

const footerStyles: Record<FooterVariant, FooterStyle> = {
  info: {
    wrapper:
      "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900",
    icon: "text-blue-500",
    Icon: Info,
  },
  warning: {
    wrapper:
      "text-yellow-700 bg-yellow-50 border-yellow-100 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-900",
    icon: "text-yellow-500",
    Icon: AlertTriangle,
  },
  danger: {
    wrapper:
      "text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900",
    icon: "text-red-500",
    Icon: AlertCircle,
  },
};
interface SectionCardV2Props {
  isLoading?: boolean;
  skeletonRows?: number;
  className?: string;
  footerText?: string;
  footerVariant?: keyof typeof footerStyles;
  children?: React.ReactNode;
}

export function SectionCardV2({
  isLoading,
  skeletonRows = 6,
  className,
  footerText,
  footerVariant = "info",
  children,
}: SectionCardV2Props) {
  const footer = footerText ? footerStyles[footerVariant] : null;
  const hasFooter = !isLoading && !!footer && !!footerText;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-none border-0 shadow-none",
        className,
      )}
    >
      <CardContent className={cn(hasFooter && "pb-6")}>
        {isLoading ? (
          <InfoGrid>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <InfoItem key={i} label="" isLoading />
            ))}
          </InfoGrid>
        ) : (
          children
        )}
      </CardContent>

      {hasFooter && footer && (
        <CardFooter
          className={cn(
            "border-t px-4 py-2.5 flex items-start gap-2",
            footer.wrapper,
          )}
        >
          <footer.Icon
            className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", footer.icon)}
          />
          <p className="text-xs leading-snug">{footerText}</p>
        </CardFooter>
      )}
    </Card>
  );
}
interface SectionCardProps {
  title: string;
  onEdit?: () => void;
  editLabel?: string;
  isLoading?: boolean;
  skeletonRows?: number;
  className?: string;
  footerText?: string;
  footerVariant?: FooterVariant;
  isEditDisabled?: boolean;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  onEdit,
  editLabel = "Edit",
  isLoading,
  skeletonRows = 6,
  className,
  footerText,
  footerVariant = "info",
  isEditDisabled = false,
  children,
}: SectionCardProps) {
  const footer = footerText ? footerStyles[footerVariant] : null;
  const hasFooter = !isLoading && !!footer && !!footerText;

  return (
    <Card className={cn("overflow-hidden rounded-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <CardTitle className="text-sm font-semibold tracking-tight">
            {title}
          </CardTitle>
        )}

        {isLoading ? (
          <Skeleton className="h-7 w-14" />
        ) : onEdit ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isEditDisabled}
            className="flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-auto disabled:cursor-not-allowed"
          >
            <Pencil className="h-3 w-3" />
            {editLabel}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className={cn(hasFooter && "pb-6")}>
        {isLoading ? (
          <InfoGrid>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <InfoItem key={i} label="" isLoading />
            ))}
          </InfoGrid>
        ) : (
          children
        )}
      </CardContent>

      {hasFooter && footer && (
        <CardFooter
          className={cn(
            "border-t px-4 py-2.5 flex items-start gap-2 rounded-none",
            footer.wrapper,
          )}
        >
          <footer.Icon
            className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", footer.icon)}
          />
          <p className="text-xs leading-snug">{footerText}</p>
        </CardFooter>
      )}
    </Card>
  );
}


interface InfoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function InfoGrid({ children, className }: InfoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}


interface InfoItemProps {
  label: string;
  value?: string | null;
  naLabel?: string;
  isLoading?: boolean;
  multiline?: boolean;
  className?: string;
}

export function InfoItem({
  label,
  value,
  naLabel = "N/A",
  isLoading,
  multiline = false,
  className,
}: InfoItemProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 min-w-0", className)}>
      <p className="text-xs font-medium text-muted-foreground  tracking-wide truncate">
        {label}
      </p>
      {value ? (
        multiline ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm font-medium text-foreground leading-normal line-clamp-2 wrap-break-word cursor-default">
                  {value}
                </p>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-xs text-xs leading-relaxed wrap-break-word whitespace-pre-wrap"
              >
                {value}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <p className="text-sm font-medium text-foreground leading-normal truncate">
            {value}
          </p>
        )
      ) : (
        <p className="text-sm text-muted-foreground/60 leading-normal">
          {naLabel}
        </p>
      )}
    </div>
  );
}
