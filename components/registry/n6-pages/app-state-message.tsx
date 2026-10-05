import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/app-empty-state";
import { cn } from "@/lib/ui-utils";
import {
  alertDescriptionClasses,
  alertTitleClasses,
  alertVariants,
  skeletonClasses,
} from "@/lib/ui-variants";

/**
 * StateMessage — the empty, error, "not configured" and loading states every
 * section needs, so no page invents its own wording or colours.
 *
 * - empty:        nothing to show yet (not a fault)
 * - error:        the request failed; says what to do next
 * - unconfigured: the API answered 503 (a product database is not set up)
 * - unavailable:  the backend or WorkOS is briefly unreachable; retry
 * - loading:      skeleton rows (for streamed or slow sections)
 *
 * The React build of contract `app/state-message`, beside
 * `app-state-message.astro` (same markup and classes; the alert and skeleton
 * are rendered with the shared `@/lib/ui-variants` recipes). A server component.
 */
interface StateMessageProps {
  kind: "empty" | "error" | "unconfigured" | "unavailable" | "loading";
  title?: string;
  message?: string;
  rows?: number;
  /** Heading level of the empty state's title (default 2). */
  level?: 2 | 3 | 4;
  children?: ReactNode;
}

const defaults = {
  empty: { title: "Nothing here yet", variant: "default" },
  error: { title: "Something went wrong", variant: "destructive" },
  unconfigured: { title: "Not configured", variant: "warning" },
  unavailable: { title: "Temporarily unavailable", variant: "warning" },
  loading: { title: "Loading", variant: "default" },
} as const;

const has = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false;

function StateMessage({
  kind,
  title,
  message,
  rows = 4,
  level = 2,
  children,
}: StateMessageProps) {
  const d = defaults[kind];
  if (kind === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="space-y-3"
        data-slot="state-loading"
      >
        <span className="sr-only">{title ?? d.title}</span>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            data-slot="skeleton"
            aria-hidden="true"
            className={cn(skeletonClasses, "h-10 w-full")}
          />
        ))}
      </div>
    );
  }
  if (kind === "empty") {
    return (
      <div data-slot="state-empty">
        <EmptyState title={title ?? d.title} message={message} level={level}>
          {children}
        </EmptyState>
      </div>
    );
  }
  const hasBody = Boolean(message) || has(children);
  return (
    <div
      role="alert"
      data-slot="alert"
      data-state={kind}
      className={cn(alertVariants({ variant: d.variant }))}
    >
      <p data-slot="alert-title" className={alertTitleClasses}>
        {title ?? d.title}
      </p>
      {hasBody && (
        <div data-slot="alert-description" className={alertDescriptionClasses}>
          {message && <p>{message}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

export { StateMessage, type StateMessageProps };
