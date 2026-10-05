import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/site-icon";

/**
 * EmptyState — a bordered card for "nothing here yet": a title, one or two
 * lines of help, and the next steps (`children`: a secondary and a primary
 * button). Calm and centred, with room but no illustration. The title is a
 * heading at `level` (default h2) so it is in the page outline.
 *
 * The React build of contract `app/empty-state`, beside `app-empty-state.astro`
 * (same markup and classes). A server component.
 */
interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  level?: 2 | 3 | 4;
  children?: ReactNode;
}

function EmptyState({
  title,
  message,
  icon,
  level = 2,
  children,
}: EmptyStateProps) {
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  const hasChildren =
    children !== undefined && children !== null && children !== false;
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-12 text-center"
      data-slot="empty-state"
    >
      {icon && (
        <span className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted-foreground">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      )}
      <Heading className="text-h6 font-semibold">{title}</Heading>
      {message && (
        <p className="max-w-prose text-body-sm text-muted-foreground">
          {message}
        </p>
      )}
      {hasChildren && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export { EmptyState, type EmptyStateProps };
