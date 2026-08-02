import { cn } from "@/lib/utils"
import { Loader2Icon } from "@/lib/icons"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      data-slot="spinner"
      data-portal="https://mzizi.dev/components/spinner"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
