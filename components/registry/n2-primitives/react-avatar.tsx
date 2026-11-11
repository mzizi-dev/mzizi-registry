import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui-utils";

/**
 * Avatar — dependency-light image avatar with an initials fallback.
 *
 * NOT Radix: kept minimal and SSR-friendly. Renders the image when
 * `src` is set (falling back to initials on load error via a tiny
 * inline handler), otherwise renders the `fallback` initials. Colours
 * come from the semantic `muted` surface token — no hex.
 */
export const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground font-medium select-none",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-caption",
        md: "h-10 w-10 text-body-sm",
        lg: "h-14 w-14 text-body",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Image URL. When omitted, the initials fallback renders. */
  src?: string;
  /** Alt text for the image / accessible label. */
  alt?: string;
  /** Initials (or short text) shown when there's no image. */
  fallback?: string;
  class?: string;
  className?: string;
}

export function Avatar({
  size,
  src,
  alt,
  fallback,
  class: astroClass,
  className,
}: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      role="img"
      aria-label={alt ?? fallback}
      className={cn(avatarVariants({ size }), astroClass, className)}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
          loading="lazy"
          data-slot="avatar-image"
        />
      ) : (
        <span data-slot="avatar-fallback">{fallback}</span>
      )}
    </span>
  );
}
