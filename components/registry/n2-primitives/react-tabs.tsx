"use client";

import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Tabs — a minimal accessible tab set.
 *
 * Deliberately NOT Radix (kept dependency-light): a small React
 * context drives selection, with the WAI-ARIA tabs pattern —
 * `role="tablist" / "tab" / "tabpanel"`, `aria-selected`,
 * `aria-controls`/`aria-labelledby`, roving `tabIndex`, and
 * Left/Right/Home/End keyboard navigation. Controlled (`value` +
 * `onValueChange`) or uncontrolled (`defaultValue`). Colours come from
 * the semantic tokens — no hex.
 */
interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used within <Tabs>`);
  return ctx;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  id?: string;
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  id,
  class: astroClass,
  className,
  children,
}: TabsProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const reactId = React.useId();
  const baseId = id ?? reactId;

  const setValue = React.useCallback(
    (v: string) => {
      if (!isControlled) setInternal(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId }}>
      <div data-slot="tabs" className={cn(astroClass, className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  class?: string;
  className?: string;
}

export function TabsList({
  class: astroClass,
  className,
  children,
  ...props
}: TabsListProps) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not([disabled])',
      ),
    );
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft")
      next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-muted p-1",
        astroClass,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function TabsTrigger({
  value,
  disabled,
  class: astroClass,
  className,
  children,
}: TabsTriggerProps) {
  const { value: current, setValue, baseId } = useTabs("TabsTrigger");
  const selected = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-content-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      data-slot="tabs-trigger"
      data-state={selected ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full px-4 text-body-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        astroClass,
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  /**
   * Render the panel's content even while it is inactive (it keeps the
   * `hidden` attribute). For static rendering with no hydration — e.g. an
   * Astro page with no `client:*` directive — where every panel has to be in
   * the HTML and a small script (or CSS) switches them.
   */
  forceMount?: boolean;
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function TabsContent({
  value,
  forceMount = false,
  class: astroClass,
  className,
  children,
}: TabsContentProps) {
  const { value: current, baseId } = useTabs("TabsContent");
  const selected = current === value;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-content-${value}`}
      aria-labelledby={`${baseId}-trigger-${value}`}
      hidden={!selected}
      tabIndex={0}
      data-slot="tabs-content"
      data-state={selected ? "active" : "inactive"}
      className={cn(
        "mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        astroClass,
        className,
      )}
    >
      {selected || forceMount ? children : null}
    </div>
  );
}
