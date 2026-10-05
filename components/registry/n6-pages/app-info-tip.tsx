import { Icon } from "@/components/ui/site-icon";

/**
 * InfoTip (React) — a small info icon that explains the thing next to it.
 * The icon is a button so it takes keyboard focus; the explanation is a
 * tooltip shown on hover and on focus, and it is the button's accessible
 * description. Implements contract `app/info-tip` beside `app-info-tip.astro`,
 * with the same markup. A server component: no script.
 *
 * The Astro build also ships a global rule hiding tips under
 * `[data-tips-hidden]` (AppShell's Escape handling); a React app puts that
 * rule in its global stylesheet.
 */
interface InfoTipProps {
  /** The explanation. */
  text: string;
  /** What it explains, for the button's name ("About Sessions"). */
  about: string;
  id: string;
}

function InfoTip({ text, about, id }: InfoTipProps) {
  return (
    <span className="relative inline-flex align-middle" data-slot="info-tip">
      <button
        type="button"
        aria-label={`About ${about}`}
        aria-describedby={id}
        className="peer inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-8 pointer-coarse:w-8"
      >
        <Icon name="info" className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-64 -translate-x-1/2 rounded-sm bg-foreground px-2.5 py-1.5 text-caption leading-snug font-normal text-background opacity-0 shadow-md transition-opacity peer-hover:visible peer-hover:opacity-100 peer-focus-visible:visible peer-focus-visible:opacity-100"
        data-slot="info-tip-text"
      >
        {text}
      </span>
    </span>
  );
}

export { InfoTip, type InfoTipProps };
