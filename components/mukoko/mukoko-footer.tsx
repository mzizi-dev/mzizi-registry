import { cn } from "@/lib/utils"
import { MukokoLogo } from "@/components/brand/mukoko-logo"
import { Separator } from "@/components/ui/separator"

export interface FooterLinkGroup {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}

interface MukokoFooterProps {
  showProducts?: boolean
  customLinks?: FooterLinkGroup[]
  className?: string
}

const MINERALS = [
  { name: "cobalt", cssVar: "--color-cobalt" },
  { name: "tanzanite", cssVar: "--color-tanzanite" },
  { name: "malachite", cssVar: "--color-malachite" },
  { name: "gold", cssVar: "--color-gold" },
  { name: "terracotta", cssVar: "--color-terracotta" },
]

const PRODUCTS: FooterLinkGroup = {
  title: "Products",
  links: [
    { label: "mukoko.com", href: "https://www.mukoko.com", external: true },
    { label: "Lingo", href: "https://lingo.mukoko.com", external: true },
    { label: "Nhimbe", href: "https://nhimbe.com", external: true },
    { label: "Bushtrade", href: "https://bushtrade.co.zw", external: true },
    { label: "Bundu", href: "https://bundu.family", external: true },
  ],
}

const SERVICES: FooterLinkGroup = {
  title: "Services",
  links: [
    { label: "News", href: "https://news.mukoko.com", external: true },
    { label: "Weather", href: "https://weather.mukoko.com", external: true },
  ],
}

export function MukokoFooter({
  showProducts = true,
  customLinks = [],
  className,
}: MukokoFooterProps) {
  const linkGroups = showProducts
    ? [PRODUCTS, SERVICES, ...customLinks]
    : customLinks

  return (
    <footer
      data-slot="mukoko-footer"
      className={cn("px-4 pb-10 pt-8 sm:px-6 sm:pb-12", className)}
    >
      <div className="mx-auto max-w-5xl">
        <Separator className="mb-8" />

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <MukokoLogo size={24} showWordmark />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              The design system and component registry for the mukoko product
              family. Built on the Five African Minerals palette.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {MINERALS.map((m) => (
                <span
                  key={m.name}
                  className="size-2 rounded-full"
                  style={{ backgroundColor: `var(${m.cssVar})` }}
                  title={m.name}
                />
              ))}
            </div>
          </div>

          {/* Links */}
          {linkGroups.length > 0 && (
            <div className="flex flex-wrap gap-8 sm:gap-12">
              {linkGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {group.title}
                  </span>
                  {group.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <span className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://github.com/nyuchitech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              Nyuchi
            </a>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            v7.0.0
          </span>
        </div>
      </div>
    </footer>
  )
}
