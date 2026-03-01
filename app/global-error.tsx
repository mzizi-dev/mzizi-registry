"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#0A0A0A] font-sans text-[#F5F5F4]">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#1E1E1E]">
            <span className="text-lg font-bold">m</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-[#9A9A95]">
              An unexpected error occurred. Our team has been notified.
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-[#9A9A95]">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            className="rounded-xl bg-[#F5F5F4] px-5 py-2.5 text-sm font-medium text-[#0A0A0A] transition-opacity hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
