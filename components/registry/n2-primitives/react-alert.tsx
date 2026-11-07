import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui-utils";
import {
  alertDescriptionClasses,
  alertTitleClasses,
  alertVariants,
} from "@/lib/ui-variants";

/**
 * Alert — shadcn CVA pattern mapped onto the Five-African-Minerals
 * container tokens. Variants name the semantic role, not the colour.
 * `role="alert"` announces the message to assistive tech.
 */

export interface AlertProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  class?: string;
  className?: string;
}

export function Alert({
  variant,
  class: astroClass,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), astroClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  class?: string;
  className?: string;
}

export function AlertTitle({
  class: astroClass,
  className,
  children,
  ...props
}: AlertTitleProps) {
  return (
    <p
      data-slot="alert-title"
      className={cn(alertTitleClasses, astroClass, className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function AlertDescription({
  class: astroClass,
  className,
  children,
  ...props
}: AlertTitleProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn(alertDescriptionClasses, astroClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { alertVariants };
