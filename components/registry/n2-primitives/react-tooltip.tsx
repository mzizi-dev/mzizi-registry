"use client";

import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Tooltip — a minimal accessible tooltip.
 *
 * Deliberately NOT Radix (kept dependency-light): wraps a single
 * trigger and shows `content` on hover AND keyboard focus (so it's not
 * hover-only), wiring `aria-describedby` to the tooltip's generated id
 * and `role="tooltip"`. Escape dismisses it. Positioning is CSS-only
 * (absolute, `side` prop) — no floating-ui. Colours come from the
 * semantic `foreground` / `background` tokens — no hex.
 *
 * The trigger must be a single focusable element (button/link). The
 * wrapper is an inline span so it doesn't disturb layout.
 */
export interface TooltipProps {
  /** Tooltip text (or rich node) shown on hover/focus. */
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  class?: string;
  className?: string;
  children: React.ReactNode;
}

const sideClasses: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({
  content,
  side = "top",
  class: astroClass,
  className,
  children,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  return (
    <span
      className="relative inline-flex"
      data-slot="tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        data-slot="tooltip-content"
        data-state={open ? "open" : "closed"}
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-xs rounded-md bg-foreground px-3.5 py-1.5 text-caption font-medium text-background shadow-md",
          sideClasses[side],
          astroClass,
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
