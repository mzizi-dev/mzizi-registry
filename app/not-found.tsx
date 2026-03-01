import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <span className="text-lg font-bold text-foreground">m</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <a href="/">Go home</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/#catalog">Browse components</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
