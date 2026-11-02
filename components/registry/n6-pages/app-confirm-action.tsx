import { Icon } from "@/components/ui/site-icon";
import { cn, exactPattern } from "@/lib/ui-utils";
import {
  appButtonVariants,
  appCheckClasses,
  appChoiceRowClasses,
  appInputClasses,
  labelClasses,
} from "@/lib/ui-variants";

/**
 * ConfirmAction — a destructive action that asks before it acts: removing a
 * member, revoking an invite, cancelling a plan, the settings danger zone.
 *
 * A trigger button opens a confirmation panel through the Popover API
 * (`popoverTarget`), so it needs no script; Escape, a click outside and
 * Cancel close it. The panel is a <form> that POSTs to `action` with its
 * hidden `fields` and a required confirm step: a checkbox the person must
 * tick (`confirm=yes`), or, with `confirmText`, a box they must type that
 * text into (`pattern` checks it in the browser; the server must check
 * `confirm` too, since a form can be posted without the page).
 *
 * The danger is in words, never colour alone: the panel says "Warning:" and
 * what cannot be undone, and the buttons name the action. In a browser with
 * no Popover API the panel shows in place under the trigger, still a form
 * with the confirm step.
 *
 * The React build of contract `app/confirm-action`, beside
 * `app-confirm-action.astro` (the default build): the same markup and
 * classes, a server component.
 */
interface ConfirmActionProps {
  /** A unique id on the page; the panel and its parts are `<id>-*`. */
  id: string;
  /** The trigger's text, naming the action ("Remove member"). */
  label: string;
  /** The panel's heading ("Remove Tendai Moyo from Kweli Foods?"). */
  title: string;
  /** What happens, in a sentence. */
  description?: string;
  /** The warning, after `warningLabel`. */
  warning?: string;
  /** The word that names the danger ("Warning:"), for another language. */
  warningLabel?: string;
  /** Where the form posts. */
  action: string;
  /** "post" (default) or "get". */
  method?: "post" | "get";
  /** Hidden fields posted with the form. */
  fields?: Record<string, string>;
  /** The submit button's text (defaults to `label`). */
  confirmLabel?: string;
  /** The cancel button's text. */
  cancelLabel?: string;
  /** The text the person must type to confirm; without it they tick a box. */
  confirmText?: string;
  /** The typed step's label, in place of "Type <confirmText> to confirm". */
  confirmPrompt?: string;
  /** The checkbox's label, when there is no `confirmText`. */
  acknowledge?: string;
  /** The trigger's look: an outline (default) or a filled destructive button. */
  variant?: "destructive-outline" | "destructive";
  /** The trigger's size. */
  size?: "sm" | "md";
  /** The heading's level (2 or 3). */
  headingLevel?: 2 | 3;
  className?: string;
}

function ConfirmAction({
  id,
  label,
  title,
  description,
  warning = "This cannot be undone.",
  warningLabel = "Warning:",
  action,
  method = "post",
  fields = {},
  confirmLabel,
  cancelLabel = "Cancel",
  confirmText,
  confirmPrompt,
  acknowledge = "I understand.",
  variant = "destructive-outline",
  size = "md",
  headingLevel = 2,
  className,
}: ConfirmActionProps) {
  const panel = `${id}-panel`;
  const describedBy = [
    description ? `${id}-description` : null,
    `${id}-warning`,
  ]
    .filter(Boolean)
    .join(" ");
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <div data-slot="confirm-action" className={cn("inline-block", className)}>
      <button
        type="button"
        popoverTarget={panel}
        aria-haspopup="dialog"
        className={appButtonVariants({ variant, size })}
      >
        {label}
      </button>
      <div
        id={panel}
        popover="auto"
        role="dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={describedBy}
        data-slot="confirm-panel"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md border border-border bg-popover p-5 text-popover-foreground shadow-lg backdrop:bg-foreground/30"
      >
        <Heading
          id={`${id}-title`}
          className="text-body font-semibold text-foreground"
        >
          {title}
        </Heading>
        {description && (
          <p
            id={`${id}-description`}
            className="mt-1 text-body-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        <p
          id={`${id}-warning`}
          data-slot="confirm-warning"
          className="mt-3 flex items-start gap-2 rounded-sm border border-destructive/40 bg-card px-3 py-2 text-body-sm text-destructive"
        >
          <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">{warningLabel}</strong> {warning}
          </span>
        </p>
        <form method={method} action={action} className="mt-4 grid gap-3">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          {confirmText ? (
            <div className="grid gap-1.5" data-slot="confirm-step">
              <label htmlFor={`${id}-confirm`} className={labelClasses}>
                {confirmPrompt ?? (
                  <>
                    Type <span className="font-mono">{confirmText}</span> to
                    confirm
                  </>
                )}
              </label>
              <input
                id={`${id}-confirm`}
                name="confirm"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                pattern={exactPattern(confirmText)}
                className={appInputClasses}
              />
            </div>
          ) : (
            <label
              htmlFor={`${id}-confirm`}
              data-slot="confirm-step"
              className={appChoiceRowClasses}
            >
              <input
                id={`${id}-confirm`}
                name="confirm"
                type="checkbox"
                value="yes"
                required
                className={appCheckClasses}
              />
              <span>{acknowledge}</span>
            </label>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              popoverTarget={panel}
              popoverTargetAction="hide"
              className={appButtonVariants({ variant: "outline" })}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              data-slot="confirm-submit"
              className={appButtonVariants({ variant: "destructive" })}
            >
              {confirmLabel ?? label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ConfirmAction, type ConfirmActionProps };
