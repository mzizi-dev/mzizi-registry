import { ICON_PATHS, type IconName } from "@/lib/site-icons"

/**
 * Icon — the design system's inline-SVG set (React). The same glyphs and the
 * same markup as `site-icon.astro`: stroke-based at 1.75 weight, inherits
 * `currentColor`, sized to 1em unless `className` says otherwise. Decorative
 * (aria-hidden) unless it has a `title`, which becomes its accessible name.
 */
interface IconProps {
  name: IconName
  /** Accessible label; omitted → decorative (aria-hidden). */
  title?: string
  className?: string
}

function Icon({ name, title, className }: IconProps) {
  const decorative = !title
  return (
    <svg
      className={["inline-block h-[1em] w-[1em]", className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-slot="icon"
      data-icon={name}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : title}
    >
      {title && <title>{title}</title>}
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

export { Icon, type IconName, type IconProps }
