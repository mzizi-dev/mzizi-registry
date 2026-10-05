import { cn } from "@/lib/utils"

/*
 * APP SKELETON — the Dashboard Standard skeleton (`contracts/app/skeleton`), React build.
 *
 * A loading placeholder on the `muted` token, sized by `className` and hidden from screen
 * readers: announcing the loading state is StateMessage's job. Its Astro twin is
 * `app-skeleton.astro`; the registry primitive is `skeleton.tsx` (`contracts/ui/skeleton`).
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
