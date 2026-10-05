import { cn } from "@/lib/ui-utils";
import { appInputClasses, labelClasses } from "@/lib/ui-variants";

/**
 * FormField — label, input, hint and error wired together: the hint and
 * the error are announced with the field (aria-describedby), an error sets
 * aria-invalid, and the label is always visible (never placeholder-only).
 *
 * The React build of contract `app/form-field`, beside `app-form-field.astro`
 * (same markup and classes; the label and input use the shared
 * `@/lib/ui-variants` recipes). A server component: the input is
 * uncontrolled (`defaultValue`), posted with its form.
 */
interface FormFieldProps {
  name: string;
  label: string;
  value?: string | null;
  type?: "text" | "email" | "tel" | "url" | "search";
  hint?: string;
  error?: string | null;
  required?: boolean;
  readonly?: boolean;
  autocomplete?: string;
  maxlength?: number;
  inputmode?: "text" | "tel" | "email" | "url";
}

function FormField({
  name,
  label,
  value,
  type = "text",
  hint,
  error,
  required = false,
  readonly = false,
  autocomplete,
  maxlength,
  inputmode,
}: FormFieldProps) {
  const id = `field-${name}`;
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="grid content-start gap-1.5" data-slot="form-field">
      <label data-slot="label" htmlFor={id} className={cn(labelClasses)}>
        {label}
        {required && <span className="text-muted-foreground"> (required)</span>}
      </label>
      <input
        data-slot="input"
        className={cn(appInputClasses, readonly ? "bg-muted" : undefined)}
        id={id}
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        readOnly={readonly}
        autoComplete={autocomplete}
        maxLength={maxlength}
        inputMode={inputmode}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-body-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="text-body-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export { FormField, type FormFieldProps };
