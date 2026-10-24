/**
 * AddressSelector — "Deliver to": pick one of your saved addresses. A real radio group
 * in a `<fieldset>` with a `<legend>`, so it works with no script and submits with its
 * form. The React build of contract `ui/address-selector`, beside
 * `address-selector.astro`: the same markup, uncontrolled (`defaultChecked`), so the
 * choice travels with the form; read it from the form's `change` event if you need it live.
 */
import { cn } from "@/lib/utils"

export interface AddressOption {
  /** Submitted as the field's value. */
  id: string
  /** "Home", "Shop", "Mum's place". */
  label: string
  /** A line a courier can read: "12 Moyo Rd, Strathaven, Harare". */
  line?: string
  /** The Kweli address code. */
  code?: string
  /** A private or link-only address is marked in words. */
  visibility?: "public" | "link" | "private"
}

export interface AddressSelectorProps {
  /** The form field name. */
  name?: string
  legend?: string
  addresses: AddressOption[]
  /** The id of the chosen address. */
  value?: string
  /** Where "Add an address" goes. */
  addHref?: string
  addLabel?: string
  className?: string
}

const PRIVACY = { private: "Private", link: "Link only", public: undefined } as const

export function AddressSelector({
  name = "address",
  legend = "Deliver to",
  addresses,
  value,
  addHref,
  addLabel = "Add an address",
  className,
}: AddressSelectorProps) {
  return (
    <fieldset
      data-slot="address-selector"
      data-portal="https://mzizi.dev/components/address-selector"
      className={cn("flex w-full min-w-0 flex-col gap-2 border-0 p-0", className)}
    >
      <legend className="mb-2 text-body-sm font-semibold text-foreground">{legend}</legend>
      {addresses.length === 0 && (
        <p data-slot="address-selector-empty" className="text-body-sm text-muted-foreground">
          No saved addresses yet.
        </p>
      )}
      {addresses.map((a) => (
        <label
          key={a.id}
          data-slot="address-option"
          className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-foreground transition-colors hover:bg-muted has-[:checked]:border-primary has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
        >
          <input
            type="radio"
            name={name}
            value={a.id}
            defaultChecked={a.id === value}
            className="size-5 shrink-0 accent-primary outline-none"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="truncate text-body-sm font-medium">{a.label}</span>
              {a.visibility && PRIVACY[a.visibility] && (
                <span data-slot="address-option-privacy" className="shrink-0 text-caption text-muted-foreground">
                  {PRIVACY[a.visibility]}
                </span>
              )}
            </span>
            {a.line && <span className="truncate text-caption text-muted-foreground">{a.line}</span>}
          </span>
          {a.code && (
            <code data-slot="address-option-code" className="shrink-0 font-mono text-caption tracking-wider text-muted-foreground">
              {a.code}
            </code>
          )}
        </label>
      ))}
      {addHref && (
        <a
          href={addHref}
          data-slot="address-selector-add"
          className="inline-flex min-h-11 items-center self-start rounded-full px-3 text-body-sm font-medium text-primary no-underline outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {addLabel}
        </a>
      )}
    </fieldset>
  )
}
