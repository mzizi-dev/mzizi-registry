import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { experimentalColors, heritageColors, minerals } from "@/lib/tokens/palette.generated"
import {
  backgroundColors,
  brandMeta,
  ecosystem,
  mineralApiHex,
  semanticColors,
  spacing,
  typography,
} from "@/lib/tokens/brand.source"

const logger = createLogger("brand")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/brand
 *
 * The whole brand system, assembled from disk. No database, no network, no
 * credential — this route answers with every Supabase variable unset, and it
 * has to: the registry has no database going forwards.
 *
 * It used to open with `if (!isSupabaseConfigured()) return 503` and then
 * `await getBrandSystem()`, which read seven collections over the wire. On a
 * deployment with no database credentials that guard was the entire response:
 * the one endpoint serving the corrected 7/7/7 palette answered 503 to
 * everybody. The guard and the read are both gone.
 *
 * SOURCES, and why there are two of them:
 *   - the 21 colour families  `lib/tokens/palette.generated.ts`
 *   - everything else         `lib/tokens/brand.source.ts`
 * The palette snapshot is generated from `palette.source.ts` by
 * `pnpm tokens:sync` and gated by `pnpm tokens:verify`; the brand source is
 * hand-authored. Minerals now come from the snapshot too — they were the last
 * collection still read over the wire, which is why this route served seven of
 * twenty-one families when the database was unreachable.
 *
 * `__tests__/api/brand-from-disk.test.ts` fails if a family or a field goes
 * missing from this payload.
 */
export async function GET() {
  try {
    const fontEntries = typography.filter((t) => t.entryType === "font")
    const scaleEntries = typography.filter((t) => t.entryType === "scale")

    const fonts: Record<string, { family: string; usage: string; reason: string }> = {}
    for (const f of fontEntries) {
      const key = f.name.replace("font-", "")
      fonts[key] = {
        family: f.family ?? "",
        usage: f.usage,
        reason: f.reason ?? "",
      }
    }

    const brandSystem = {
      $schema: "https://mzizi.dev/schema/brand.json",
      "@context": "https://schema.org",
      "@type": "Brand",
      version: brandMeta.version,
      name: brandMeta.name,
      lastUpdated: brandMeta.lastUpdated,
      homepage: brandMeta.homepage,
      minerals: minerals.map((m) => ({
        name: m.name,
        // The mineral's single "if you only get one" value. Not derivable from
        // lightHex/darkHex — see `mineralApiHex` in lib/tokens/brand.source.ts.
        hex: mineralApiHex[m.name] ?? m.darkHex,
        lightHex: m.lightHex,
        darkHex: m.darkHex,
        containerLight: m.containerLight,
        containerDark: m.containerDark,
        cssVar: m.cssVar,
        origin: m.origin,
        symbolism: m.symbolism,
        usage: m.usage,
      })),
      ecosystem: ecosystem.map((b) => ({
        name: b.name,
        meaning: b.meaning,
        language: b.language,
        role: b.role,
        description: b.description,
        voice: b.voice,
        mineral: b.mineral,
        url: b.url,
      })),
      typography: {
        fonts,
        scale: scaleEntries.map((t) => ({
          name: t.name,
          sizePx: t.sizePx ?? 0,
          sizeRem: t.sizeRem ?? "",
          lineHeight: t.lineHeight ?? "",
          weight: t.weight ?? 400,
          font: (t.font ?? "sans") as "sans" | "serif" | "mono",
          usage: t.usage,
        })),
      },
      spacing: spacing.map((s) => ({
        name: s.name,
        px: s.px,
        rem: s.rem,
        usage: s.usage,
      })),
      radii: brandMeta.radii,
      semanticColors: semanticColors.map((c) => ({
        name: c.name,
        light: c.lightValue,
        dark: c.darkValue,
        usage: c.usage,
      })),
      backgrounds: backgroundColors.map((c) => ({
        name: c.name.replace("bg-", ""),
        light: c.lightValue,
        dark: c.darkValue,
        usage: c.usage,
      })),
      heritage: heritageColors.map((h) => ({
        name: h.name,
        hex: h.darkHex,
        lightHex: h.lightHex,
        darkHex: h.darkHex,
        cssVar: h.cssVar,
        origin: h.origin,
        symbolism: h.symbolism,
        usage: h.usage,
      })),
      experimental: experimentalColors.map((e) => ({
        name: e.name,
        hex: e.darkHex,
        lightHex: e.lightHex,
        darkHex: e.darkHex,
        containerLight: e.containerLight,
        containerDark: e.containerDark,
        onContainerLight: e.onContainerLight,
        onContainerDark: e.onContainerDark,
        uiLight: e.uiLight,
        uiDark: e.uiDark,
        cssVar: `--color-${e.name}`,
        heptagonIndex: e.heptagonIndex,
      })),
      componentSpecs: brandMeta.componentSpecs,
      accessibility: brandMeta.accessibility,
      voiceAndTone: brandMeta.voiceAndTone,
      philosophy: brandMeta.philosophy,
    }

    logger.info("Brand system served", {
      data: {
        version: brandSystem.version,
        colourFamilies:
          brandSystem.minerals.length +
          brandSystem.heritage.length +
          brandSystem.experimental.length,
      },
    })

    return NextResponse.json(brandSystem, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Brand API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
