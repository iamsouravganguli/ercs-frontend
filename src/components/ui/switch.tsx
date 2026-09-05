"use client";
import * as React from "react";
import { cn } from "@/lib/cn";


interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}


function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  size = "default",
  className,
  id,
  name,
  value,
  required,
  ...ariaProps
}: SwitchProps) {

  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };


  const track =
    size === "sm"
      ? { width: 24, height: 14, thumb: 10 }
      : { width: 32, height: 18, thumb: 14 };

  const thumbTranslate = isChecked ? track.width - track.thumb - 4 : 2;

  return (
    <>
      {}
      {name && (
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={isChecked}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 0,
            height: 0,
          }}
        />
      )}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        style={{
          width: track.width,
          height: track.height,
        }}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isChecked ? "bg-primary" : "bg-input dark:bg-input/80",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...ariaProps}
      >
        <span
          aria-hidden="true"
          style={{
            width: track.thumb,
            height: track.thumb,
            transform: `translateX(${thumbTranslate}px)`,
          }}
          className={cn(
            "pointer-events-none block rounded-full shadow-sm",
            "transition-transform duration-200 ease-in-out",
            isChecked
              ? "bg-white dark:bg-primary-foreground"
              : "bg-white dark:bg-foreground",
          )}
        />
      </button>
    </>
  );
}

export { Switch };
export type { SwitchProps };
