import { Icon, type IconName } from "@/components/ui/site-icon";

/**
 * ToolbarMenu (React) — a button in a Toolbar that opens a short list of
 * choices, each a link (a date range: "Last 24 hours", "Last 7 days", …). The
 * current choice is the button's text and is marked aria-current. A <details>
 * disclosure of links, so it needs no script. Implements contract
 * `app/toolbar-menu` beside `app-toolbar-menu.astro`, with the same markup.
 */
interface ToolbarChoice {
  label: string;
  href: string | URL;
  current?: boolean;
}

interface ToolbarMenuProps {
  /** What is being chosen, for screen readers ("Date range"). */
  label: string;
  choices: ToolbarChoice[];
  icon?: IconName;
}

function ToolbarMenu({ label, choices, icon }: ToolbarMenuProps) {
  const current = choices.find((c) => c.current) ?? choices[0];
  return (
    <details className="relative" data-slot="toolbar-menu">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-sm px-2.5 text-body-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11 [&::-webkit-details-marker]:hidden">
        {icon && (
          <Icon
            name={icon}
            className="h-4 w-4 shrink-0 text-muted-foreground"
          />
        )}
        <span className="sr-only">{label}: </span>
        <span>{current?.label}</span>
        <Icon
          name="chevron-down"
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        />
      </summary>
      <ul
        role="list"
        aria-label={label}
        className="absolute right-0 z-40 mt-1 grid min-w-44 gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      >
        {choices.map((c, i) => (
          <li key={`${i}-${c.label}`}>
            <a
              href={String(c.href)}
              aria-current={c.current ? "true" : undefined}
              className="flex min-h-8 items-center justify-between gap-3 rounded-sm px-2 text-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:font-medium pointer-coarse:min-h-11"
            >
              {c.label}
              {c.current && <Icon name="check" className="h-4 w-4 shrink-0" />}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export { ToolbarMenu, type ToolbarChoice, type ToolbarMenuProps };
