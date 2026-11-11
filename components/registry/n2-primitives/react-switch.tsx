"use client";

import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Switch — a minimal accessible toggle.
 *
 * Deliberately NOT Radix (kept dependency-light): a `<button>` with
 * `role="switch"` and `aria-checked`, supporting both controlled
 * (`checked` + `onCheckedChange`) and uncontrolled (`defaultChecked`)
 * use. It expands its hit area to the Ubuntu 48px touch-target floor
 * with padding out and a negative margin back, so the visual track
 * stays compact while the tap target stays large. Colours come
 * from the semantic `primary` / `muted` tokens — no hex.
 */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  class?: string;
  className?: string;
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  name,
  value,
  class: astroClass,
  className,
  ...aria
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked ?? false);
  const isOn = isControlled ? checked : internal;

  function toggle() {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={isOn}
      aria-label={aria["aria-label"]}
      aria-labelledby={aria["aria-labelledby"]}
      disabled={disabled}
      data-slot="switch"
      data-state={isOn ? "checked" : "unchecked"}
      onClick={toggle}
      className={cn(
        // spacing-floor: exception the switch holds no text; the negative margin cancels the padding that grows its hit area, so layout is unchanged.
        "group relative box-content inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-3 -m-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        astroClass,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-flex h-6 w-11 items-center rounded-full transition-colors",
          isOn ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
            isOn ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
      {name ? (
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={isOn}
          readOnly
          hidden
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}
    </button>
  );
}
