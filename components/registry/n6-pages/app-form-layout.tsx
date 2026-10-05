import type { ReactNode } from "react";

import { cn } from "@/lib/ui-utils";
import {
  alertDescriptionClasses,
  alertTitleClasses,
  alertVariants,
  cardVariants,
} from "@/lib/ui-variants";

/**
 * FormLayout — a titled form card that uses the width it is given: fields
 * flow in two columns from md up and one below, actions sit at the foot.
 * Posts to the page itself (Post/Redirect/Get). A form-level error is
 * announced as an alert.
 *
 * The React build of contract `app/form-layout`, beside
 * `app-form-layout.astro` (same markup and classes; the card and alert use
 * the shared `@/lib/ui-variants` recipes). A server component.
 */
interface FormLayoutProps {
  title: string;
  description?: string;
  error?: string | null;
  action?: string;
  id?: string;
  /** The fields. */
  children?: ReactNode;
  /** The submit (and cancel) buttons. */
  actions?: ReactNode;
}

function FormLayout({
  title,
  description,
  error,
  action,
  id = "form",
  children,
  actions,
}: FormLayoutProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="@container"
      data-slot="form-layout"
    >
      <div
        className={cn(
          cardVariants({ padding: "none" }),
          "overflow-hidden rounded-md",
        )}
        data-slot="card"
      >
        <div className="flex flex-col gap-1 border-b border-border px-4 py-3">
          <h2 id={`${id}-title`} className="text-h6 font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <form
          method="post"
          action={action}
          className="grid gap-4 px-4 py-4"
          noValidate
        >
          {error && (
            <div
              role="alert"
              data-slot="alert"
              className={cn(alertVariants({ variant: "destructive" }))}
            >
              <p data-slot="alert-title" className={alertTitleClasses}>
                Not saved
              </p>
              <div
                data-slot="alert-description"
                className={alertDescriptionClasses}
              >
                {error}
              </div>
            </div>
          )}
          <div className="grid gap-4 @xl:grid-cols-2">{children}</div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {actions}
          </div>
        </form>
      </div>
    </section>
  );
}

export { FormLayout, type FormLayoutProps };
