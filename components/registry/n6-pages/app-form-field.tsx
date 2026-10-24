import { cn } from "@/lib/ui-utils";
import {
  appCheckClasses,
  appChoiceRowClasses,
  appFileInputClasses,
  appInputClasses,
  appSwitchClasses,
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
 * From 1.2 it can also be a choice: a checkbox (`as="checkbox"`), a switch
 * (`as="switch"`, a native checkbox with role="switch" drawn as a pill) or a
 * radio group (`as="radio-group"` with `options`, a fieldset whose legend is
 * the label). Each is a native input inside its own label, so the whole row is
 * the hit area (36px, 48px on touch), and each posts with its form, no script.
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
    "text" | "email" | "tel" | "url" | "search" | "number" | "date" | "file";
  as?: "input" | "textarea" | "select" | "checkbox" | "switch" | "radio-group";
  options?: FieldOption[];
  checked?: boolean;
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
  checked = false,
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
  const toggle = as === "checkbox" || as === "switch";
  const requiredMark = required && (
    <span className="text-muted-foreground"> (required)</span>
  );
  return (
    <div
      className={cn("grid content-start gap-1.5", wide && "@xl:col-span-2")}
      data-slot="form-field"
    >
      {toggle ? (
        <label data-slot="label" htmlFor={id} className={appChoiceRowClasses}>
          <input
            data-slot={as}
            className={as === "switch" ? appSwitchClasses : appCheckClasses}
            type="checkbox"
            role={as === "switch" ? "switch" : undefined}
            id={id}
            name={name}
            value={value ?? "on"}
            defaultChecked={checked}
            required={required}
            disabled={readonly}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
          <span>
            {label}
            {requiredMark}
          </span>
        </label>
      ) : as === "radio-group" ? (
        <fieldset
          data-slot="radio-group"
          id={id}
          className="grid content-start"
          aria-describedby={describedBy}
        >
          <legend data-slot="label" className={cn(labelClasses, "mb-1")}>
            {label}
            {requiredMark}
          </legend>
          {options.map((o) => (
            <label key={o.value} className={appChoiceRowClasses}>
              <input
                data-slot="radio"
                className={appCheckClasses}
                type="radio"
                id={`${id}-${o.value}`}
                name={name}
                value={o.value}
                defaultChecked={o.value === value}
                required={required}
                disabled={readonly}
                aria-invalid={invalid}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <label data-slot="label" htmlFor={id} className={cn(labelClasses)}>
          {label}
          {requiredMark}
        </label>
      )}
      {toggle || as === "radio-group" ? null : as === "textarea" ? (
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
