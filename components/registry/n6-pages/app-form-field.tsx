import { cn } from "@/lib/ui-utils";
import {
  appFileInputClasses,
  appInputClasses,
  appTextareaClasses,
  labelClasses,
} from "@/lib/ui-variants";

/**
 * FormField — label, control, hint and error wired together: the hint and
 * the error are announced with the field (aria-describedby), an error sets
 * aria-invalid, and the label is always visible (never placeholder-only).
 *
 * The control is an input (text, email, tel, url, search, number, date,
 * file), a textarea (`as="textarea"`) or a native select (`as="select"`
 * with `options`), all at app density with the same wiring. `wide` spans
 * both of FormLayout's columns.
 *
 * The React build of contract `app/form-field`, beside `app-form-field.astro`
 * (same markup and classes; the label and controls use the shared
 * `@/lib/ui-variants` recipes). A server component: the controls are
 * uncontrolled (`defaultValue`), posted with their form.
 */
interface FieldOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  name: string;
  label: string;
  value?: string | null;
  type?:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "search"
    | "number"
    | "date"
    | "file";
  as?: "input" | "textarea" | "select";
  options?: FieldOption[];
  emptyOption?: string;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  wide?: boolean;
  hint?: string;
  error?: string | null;
  required?: boolean;
  readonly?: boolean;
  autocomplete?: string;
  maxlength?: number;
  inputmode?: "text" | "tel" | "email" | "url" | "numeric" | "decimal";
}

function FormField({
  name,
  label,
  value,
  type = "text",
  as = "input",
  options = [],
  emptyOption,
  rows = 5,
  accept,
  multiple = false,
  min,
  max,
  step,
  wide = false,
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
  const invalid = error ? "true" : undefined;
  const file = type === "file";
  return (
    <div
      className={cn("grid content-start gap-1.5", wide && "@xl:col-span-2")}
      data-slot="form-field"
    >
      <label data-slot="label" htmlFor={id} className={cn(labelClasses)}>
        {label}
        {required && <span className="text-muted-foreground"> (required)</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          data-slot="textarea"
          className={cn(appTextareaClasses, readonly && "bg-muted")}
          id={id}
          name={name}
          rows={rows}
          defaultValue={value ?? ""}
          required={required}
          readOnly={readonly}
          maxLength={maxlength}
          aria-describedby={describedBy}
          aria-invalid={invalid}
        />
      ) : as === "select" ? (
        <select
          data-slot="select"
          className={cn(appInputClasses, readonly && "bg-muted")}
          id={id}
          name={name}
          defaultValue={value ?? ""}
          required={required}
          disabled={readonly}
          aria-describedby={describedBy}
          aria-invalid={invalid}
        >
          {emptyOption !== undefined && <option value="">{emptyOption}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          data-slot="input"
          className={cn(
            appInputClasses,
            readonly && "bg-muted",
            file && appFileInputClasses,
          )}
          id={id}
          name={name}
          type={type}
          defaultValue={file ? undefined : (value ?? "")}
          required={required}
          readOnly={readonly}
          autoComplete={autocomplete}
          maxLength={maxlength}
          inputMode={inputmode}
          accept={accept}
          multiple={file && multiple ? true : undefined}
          min={min}
          max={max}
          step={step}
          aria-describedby={describedBy}
          aria-invalid={invalid}
        />
      )}
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

export { FormField, type FieldOption, type FormFieldProps };
