import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"

interface ErrorPageProps {
  code?: 404 | 500 | 503
  title?: string
  description?: string
}

function ErrorPage({
  code = 404,
  title,
  description,
}: ErrorPageProps) {
  const defaults: Record<number, { title: string; description: string }> = {
    404: {
      title: "Page not found",
      description: "The page you are looking for does not exist or has been moved.",
    },
    500: {
      title: "Something went wrong",
      description: "An unexpected error occurred. Our team has been notified.",
    },
    503: {
      title: "Service unavailable",
      description: "We are performing maintenance. Please try again shortly.",
    },
  }

  const resolvedTitle = title ?? defaults[code]?.title ?? "Error"
  const resolvedDescription = description ?? defaults[code]?.description ?? "An error occurred."

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        {/* Mukoko logo mark */}
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-muted">
          <span className="font-serif text-xl font-bold text-cobalt">m</span>
        </div>

        {/* Error code */}
        <p className="text-[8rem] font-bold leading-none text-muted-foreground/20 sm:text-[12rem]">
          {code}
        </p>

        {/* Title and description */}
        <h1 className="-mt-4 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          {resolvedTitle}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {resolvedDescription}
        </p>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <a href="javascript:history.back()">
              <ArrowLeft className="size-4" />
              Go back
            </a>
          </Button>
          <Button asChild>
            <a href="/">
              <Home className="size-4" />
              Go home
            </a>
          </Button>
        </div>
      </div>

      {/* Mineral accent at bottom */}
      <div className="fixed bottom-0 left-0 flex h-1 w-full">
        <div className="flex-1 bg-cobalt" />
        <div className="flex-1 bg-tanzanite" />
        <div className="flex-1 bg-malachite" />
        <div className="flex-1 bg-gold" />
        <div className="flex-1 bg-terracotta" />
      </div>
    </div>
  )
}

export { ErrorPage }
export type { ErrorPageProps }
