"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { ArrowRight, Eye } from "lucide-react";
import { cn } from "@/lib/cn";

export type GridMenuItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  allowedRoles?: string[];
  primaryAction?: {
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  };
};

type GridMenuProps = {
  items: GridMenuItem[];
  columns?: 1 | 2 | 3 | 4;
  role?: string;
  defaultPrimaryIcon?: React.ReactNode;
  defaultSecondaryIcon?: React.ReactNode;
};

const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function GridMenu({
  items,
  columns = 3,
  role,
  defaultPrimaryIcon = <ArrowRight className="w-3 h-3" />,
  defaultSecondaryIcon = <Eye className="w-3 h-3" />,
}: GridMenuProps) {
  const router = useRouter();

  const visible = items.filter(
    ({ allowedRoles }) =>
      !allowedRoles ||
      allowedRoles.length === 0 ||
      (role && allowedRoles.includes(role)),
  );

  return (
    <div className={cn("grid gap-4", colsMap[columns])}>
      {visible.map((item, index) => (
        <Card
          key={index}
          {...(item.href && {
            role: "button",
            tabIndex: 0,
            onClick: () => router.push(item.href!),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter") router.push(item.href!);
            },
            className: "cursor-pointer rounded-lg",
          })}
        >
          <CardContent className="flex flex-col h-full">
            {}
            <div className="mb-4 flex items-start justify-between">
              <div
                className={cn(
                  "flex items-center justify-center",
                  "h-10 w-10 rounded-xl",
                  "bg-muted border border-border/40",
                  "transition-all duration-200",
                  "group-hover:bg-primary/10 group-hover:border-primary/30",
                )}
              >
                <span className="text-muted-foreground group-hover:text-primary">
                  {item.icon}
                </span>
              </div>
              {item.href && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors duration-200 mt-1" />
              )}
            </div>

            {}
            <h3 className="text-sm font-semibold leading-tight mb-1.5">
              {item.title}
            </h3>

            {}
            <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
              {item.description}
            </p>

            {}
            {(item.primaryAction || item.secondaryAction) && (
              <div
                className="mt-auto flex gap-2 justify-start"
                onClick={(e) => e.stopPropagation()}
              >
                {item.primaryAction && (
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs h-8 gap-1 cursor-pointer"
                    onClick={(e) => {
                      item.primaryAction?.onClick?.(e);
                      if (!e.defaultPrevented && item.primaryAction?.href) {
                        router.push(item.primaryAction.href);
                      }
                    }}
                  >
                    {item.primaryAction.label}
                    {item.primaryAction.icon ?? defaultPrimaryIcon}
                  </Button>
                )}
                {item.secondaryAction && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-8 gap-1 cursor-pointer"
                    onClick={(e) => {
                      item.secondaryAction?.onClick?.(e);
                      if (!e.defaultPrevented && item.secondaryAction?.href) {
                        router.push(item.secondaryAction.href);
                      }
                    }}
                  >
                    {item.secondaryAction.icon ?? defaultSecondaryIcon}
                    {item.secondaryAction.label}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
