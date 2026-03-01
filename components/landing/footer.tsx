import { Separator } from "@/components/ui/separator"
import { MukokoLogo } from "@/components/brand/mukoko-logo"

const minerals = [
  { name: "cobalt", color: "bg-[var(--color-cobalt)]" },
  { name: "tanzanite", color: "bg-[var(--color-tanzanite)]" },
  { name: "malachite", color: "bg-[var(--color-malachite)]" },
  { name: "gold", color: "bg-[var(--color-gold)]" },
  { name: "terracotta", color: "bg-[var(--color-terracotta)]" },
]

export function Footer() {
  return (
    <footer className="px-4 pb-10 pt-8 sm:px-6 sm:pb-12">
      <div className="mx-auto max-w-5xl">
        <Separator className="mb-8" />

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <MukokoLogo size={24} showWordmark={true} />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              The design system and component registry for the mukoko product family. Built on the Five African Minerals palette.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {minerals.map((m) => (
                <span key={m.name} className={`size-2 rounded-full ${m.color}`} title={m.name} />
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 sm:gap-12">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">Products</span>
              <a
                href="https://www.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                mukoko.com
              </a>
              <a
                href="https://lingo.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Lingo
              </a>
              <a
                href="https://nhimbe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Nhimbe
              </a>
              <a
                href="https://bushtrade.co.zw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Bushtrade
              </a>
              <a
                href="https://bundu.family"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Bundu
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">Services</span>
              <a
                href="https://news.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                News
              </a>
              <a
                href="https://weather.mukoko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Weather
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground">Registry</span>
              <a
                href="#components"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Components
              </a>
              <a
                href="/api/r"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                API
              </a>
              <a
                href="https://github.com/nyuchitech/mukoko-registry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <span className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://github.com/nyuchitech"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-foreground transition-colors hover:text-muted-foreground"
            >
              Nyuchi
            </a>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">v6.0.0</span>
        </div>
      </div>
    </footer>
  )
}
