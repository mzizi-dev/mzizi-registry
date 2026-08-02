import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      data-portal="https://mzizi.dev/components/skeleton"
      className={cn("animate-pulse rounded-[var(--radius-xl,17px)] bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
