/**
 * Toast (React) — the result of the last action (saved, signed out), carried
 * across a Post/Redirect/Get as a flash (the app decides how). Rendered by the
 * server inside a polite live region; it stays until dismissed, so nobody is
 * timed out of reading it (WCAG 2.2.3). Dismissing needs no script: the
 * button is a label for a hidden checkbox. Implements contract `app/toast`
 * beside `app-toast.astro`, with the same markup. A server component.
 */
interface ToastMessage {
  tone: "success" | "info" | "error";
  text: string;
}

interface ToastProps {
  /** The message to show, or null for an empty live region. */
  flash: ToastMessage | null;
  /** Accessible name of the dismiss control. */
  dismissLabel?: string;
}

const TONE = {
  success: "bg-malachite-container text-malachite-on-container",
  info: "bg-cobalt-container text-cobalt-on-container",
  error: "bg-card text-destructive border border-destructive",
} as const;

function Toast({ flash, dismissLabel = "Dismiss" }: ToastProps) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
      data-slot="toast-region"
    >
      {flash && (
        <>
          <input type="checkbox" id="toast-dismiss" className="peer sr-only" />
          <div
            className={`pointer-events-auto flex w-full max-w-md items-start gap-4 rounded-lg px-5 py-4 shadow-lg peer-checked:hidden peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${TONE[flash.tone]}`}
            data-slot="toast"
            data-tone={flash.tone}
          >
            <p className="flex-1 text-body font-medium">{flash.text}</p>
            <label
              htmlFor="toast-dismiss"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-body-sm underline underline-offset-4"
            >
              {dismissLabel}
            </label>
          </div>
        </>
      )}
    </div>
  );
}

export { Toast, type ToastMessage, type ToastProps };
