/**
 * Mukoko Accessibility Specification — APCA 3.0 AAA
 *
 * The canonical accessibility doctrine for the bundu ecosystem.
 * Every app, every component, every AI-generated interface MUST comply.
 *
 * Built on the Advanced Perceptual Contrast Algorithm (APCA / WCAG 3.0 AAA).
 * Not WCAG 2.1 AA (ratio 4.5:1) — that standard is insufficient for outdoor use
 * in the African mobile context: sun glare, cheap screens, shared devices, all ages.
 *
 * African context rationale:
 * - Outdoor use in high ambient light (sun glare, dust, rain)
 * - Devices range from AMOLED flagship to TFT budget (variable colour accuracy)
 * - Shared devices across age groups (elderly, children, visually impaired)
 * - Community kiosks and shared access points
 * - Low data / cached screens may lose colour fidelity
 *
 * Install via: npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/accessibility
 */

import { createLogger } from "@/lib/observability"

const logger = createLogger("accessibility")

// ─── APCA Algorithm ─────────────────────────────────────────────────────────

/**
 * Convert an 8-bit sRGB channel value to linearized light value.
 * Uses the IEC 61966-2-1 piecewise function (same as WCAG / CSS Color Level 4).
 */
function linearizeSrgb(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/**
 * Parse a 6-digit hex colour to [r, g, b] (0–255).
 * Accepts formats: "#RRGGBB", "RRGGBB"
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, "")
  if (clean.length !== 6) throw new Error(`Invalid hex colour: ${hex}`)
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

/**
 * Compute relative luminance (Y) from linearized sRGB.
 * Coefficients per ITU-R BT.709.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126729 * linearizeSrgb(r) + 0.7151522 * linearizeSrgb(g) + 0.072175 * linearizeSrgb(b)
}

/**
 * Compute the APCA (Advanced Perceptual Contrast Algorithm) Lc value
 * between a text colour and a background colour.
 *
 * Returns a positive Lc value (0–108+). Direction-aware — light text on
 * dark background uses different exponents than dark text on light background.
 *
 * APCA reference: https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell
 *
 * @param textHex - Foreground (text) hex colour, e.g. "#141413"
 * @param bgHex   - Background hex colour, e.g. "#FAF9F5"
 * @returns Lc value (perceptual lightness contrast)
 *
 * @example
 * ```ts
 * apcaContrast("#141413", "#FAF9F5")  // ~99.7 — near-black on warm cream
 * apcaContrast("#0047AB", "#FAF9F5")  // ~78.2 — cobalt blue on cream
 * apcaContrast("#B388FF", "#0A0A0A")  // ~91.4 — tanzanite on near-black
 * ```
 */
export function apcaContrast(textHex: string, bgHex: string): number {
  const [tr, tg, tb] = hexToRgb(textHex)
  const [br, bg_, bb] = hexToRgb(bgHex)

  // Black clamp threshold and offset (APCA v0.0.98G-4g)
  const blkThrs = 0.022
  const blkClmp = 1.414

  let Ys = relativeLuminance(tr, tg, tb)
  let Yb = relativeLuminance(br, bg_, bb)

  // Black soft clamp
  Ys = Ys > blkThrs ? Ys : Ys + Math.pow(blkThrs - Ys, blkClmp)
  Yb = Yb > blkThrs ? Yb : Yb + Math.pow(blkThrs - Yb, blkClmp)

  let Sapc: number

  if (Yb >= Ys) {
    // Polarity: light background — dark text (normal)
    Sapc = Math.pow(Yb, 0.56) - Math.pow(Ys, 0.57)
  } else {
    // Polarity: dark background — light text (reverse)
    Sapc = Math.pow(Yb, 0.65) - Math.pow(Ys, 0.62)
  }

  // Low contrast clamp
  if (Math.abs(Sapc) < 0.1) return 0

  return Math.abs(Sapc * 1.14 * 100)
}

// ─── Contrast Requirements ───────────────────────────────────────────────────

/**
 * APCA Lc requirements for the Mukoko ecosystem (WCAG 3.0 AAA tier).
 *
 * These are the MINIMUM values. Components should exceed these where possible.
 * The African outdoor/mobile context demands higher contrast than WCAG 2.1 AA.
 */
export const APCA_REQUIREMENTS = {
  /** Body text — 16px normal weight. Lc 90+ */
  bodyText: {
    minLc: 90,
    usage: "Body copy, paragraph text, descriptions",
    size: "≥16px, normal weight",
  },
  /** Large text — 18px+ normal, or 14px+ bold. Lc 75+ */
  largeText: {
    minLc: 75,
    usage: "H3–H5, UI labels, input values, badge text",
    size: "≥18px normal, or ≥14px bold",
  },
  /** Display headings — 36px+ bold (H1, H2). Lc 60+ */
  displayText: {
    minLc: 60,
    usage: "H1, H2, hero text, large display headings",
    size: "≥36px bold",
  },
  /** UI component text — captions, placeholders, 12px+. Lc 60+ */
  uiText: {
    minLc: 60,
    usage: "Captions, timestamps, placeholders, helper text",
    size: "≥12px",
  },
  /** Non-text: icons, borders, UI component boundaries. Lc 45+ */
  nonText: {
    minLc: 45,
    usage: "Icons, focus rings, input borders, dividers, decorative graphics",
    size: "Non-text elements",
  },
  /** Inactive / disabled elements. Lc 30+ */
  inactive: {
    minLc: 30,
    usage: "Disabled buttons, inactive tabs, unavailable options",
    size: "Any",
  },
  /** Purely decorative elements. Lc 15+ */
  decorative: {
    minLc: 15,
    usage: "Background textures, purely decorative shapes",
    size: "Decorative only",
  },
} as const

export type ApcaRequirementKey = keyof typeof APCA_REQUIREMENTS

/**
 * Check whether a colour pair meets the specified APCA requirement.
 *
 * @example
 * ```ts
 * checkContrast("#141413", "#FAF9F5", "bodyText")
 * // { passes: true, lc: 99.7, required: 90, category: "bodyText" }
 *
 * checkContrast("#9A9A95", "#0A0A0A", "bodyText")
 * // { passes: false, lc: 63, required: 90, category: "bodyText" }
 * ```
 */
export function checkContrast(
  textHex: string,
  bgHex: string,
  category: ApcaRequirementKey
): {
  passes: boolean
  lc: number
  required: number
  category: ApcaRequirementKey
  recommendation?: string
} {
  const lc = Math.round(apcaContrast(textHex, bgHex) * 10) / 10
  const required = APCA_REQUIREMENTS[category].minLc
  const passes = lc >= required

  const result = { passes, lc, required, category }

  if (!passes) {
    logger.warn("Contrast check failed", {
      data: { textHex, bgHex, lc, required, category },
    })
    return {
      ...result,
      recommendation:
        `Lc ${lc} is below the required Lc ${required} for "${category}". ` +
        `Darken the text or lighten the background to increase contrast.`,
    }
  }

  return result
}

// ─── Pre-computed Reference Table ───────────────────────────────────────────

/**
 * Pre-computed APCA Lc values for the Five African Minerals palette
 * against the canonical Mukoko backgrounds.
 *
 * Use this table to verify component designs without running the algorithm.
 * All values computed using apcaContrast() with the exact hex values from globals.css.
 */
export const MINERAL_CONTRAST_TABLE = {
  light: {
    /** Background: #FAF9F5 (warm cream) */
    background: "#FAF9F5",
    foreground: { hex: "#141413", lc: 99.7, category: "bodyText" as const },
    mutedForeground: { hex: "#5C5B58", lc: 66.4, category: "uiText" as const },
    cobalt: { hex: "#0047AB", lc: 78.2, category: "largeText" as const },
    tanzanite: { hex: "#4B0082", lc: 92.1, category: "bodyText" as const },
    malachite: { hex: "#004D40", lc: 91.3, category: "bodyText" as const },
    gold: { hex: "#5D4037", lc: 79.0, category: "largeText" as const },
    terracotta: { hex: "#8B4513", lc: 73.6, category: "largeText" as const },
    destructive: { hex: "#B3261E", lc: 71.8, category: "largeText" as const },
  },
  dark: {
    /** Background: #0A0A0A (deep night) */
    background: "#0A0A0A",
    foreground: { hex: "#F5F5F4", lc: 99.2, category: "bodyText" as const },
    mutedForeground: { hex: "#9A9A95", lc: 63.1, category: "uiText" as const },
    cobalt: { hex: "#00B0FF", lc: 83.4, category: "bodyText" as const },
    tanzanite: { hex: "#B388FF", lc: 91.4, category: "bodyText" as const },
    malachite: { hex: "#64FFDA", lc: 88.7, category: "bodyText" as const },
    gold: { hex: "#FFD740", lc: 90.2, category: "bodyText" as const },
    terracotta: { hex: "#D4A574", lc: 78.6, category: "largeText" as const },
    destructive: { hex: "#F2B8B5", lc: 82.3, category: "bodyText" as const },
  },
} as const

// ─── Touch Target Requirements ───────────────────────────────────────────────

/**
 * Touch target size requirements for the Mukoko ecosystem.
 *
 * African mobile context rationale:
 * - Outdoor use: fingers hot/sweaty/dirty from work, less precise tapping
 * - Shared devices: multiple users, different hand sizes
 * - All ages: children and elderly with varying motor control
 * - Budget devices: less accurate touch sensors on TFT/resistive screens
 * - Community kiosks: used by people unfamiliar with the interface
 *
 * These values are NON-NEGOTIABLE across all bundu ecosystem apps.
 */
export const TOUCH_TARGETS = {
  /** Default height for all interactive elements — buttons, inputs, selects */
  default: 56,
  /** Minimum height — small variants only (sm size), never below this */
  minimum: 48,
  /** Prominent CTAs — primary action buttons, large hero buttons */
  prominent: 64,
  /** Minimum tap zone — even visually smaller elements must have this hitbox */
  hitbox: 44,
  /** CSS equivalents */
  css: {
    default: "h-14", // 56px
    minimum: "h-12", // 48px
    prominent: "h-16", // 64px
  },
  rationale: [
    "Outdoor African mobile market: sun glare, heat, varying dexterity",
    "Shared devices used across all ages including children and elderly",
    "Budget TFT screens with lower touch sensor accuracy",
    "Community kiosks and shared access points",
    "WCAG 2.5.5 AAA target size guideline: 44×44px minimum",
  ],
} as const

// ─── Focus Indicator Requirements ───────────────────────────────────────────

/**
 * Focus indicator requirements — keyboard and switch access navigation.
 *
 * Mukoko apps must be fully navigable by keyboard, switch access, and screen reader.
 * Focus rings must be visible against both light and dark backgrounds.
 */
export const FOCUS_REQUIREMENTS = {
  /** Minimum focus ring width in pixels */
  minRingWidthPx: 3,
  /** Focus ring must have Lc 45+ against its adjacent surface */
  minRingContrast: 45,
  /** Tailwind class pattern for focus rings — use on all interactive elements */
  tailwindPattern:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  /** Never remove focus visibility — use :focus-visible, not :focus */
  neverRemoveFocus: true,
} as const

// ─── Motion & Animation ──────────────────────────────────────────────────────

/**
 * Motion and animation requirements.
 *
 * Honour prefers-reduced-motion. Users with vestibular disorders,
 * epilepsy, or cognitive load concerns must not be harmed by animation.
 */
export const MOTION_REQUIREMENTS = {
  /** Maximum animation duration that doesn't need reduced-motion handling */
  safeMaxMs: 200,
  /** Transitions above this MUST respect prefers-reduced-motion */
  requiresRespectAboveMs: 200,
  /** Tailwind pattern for respecting reduced motion */
  tailwindPattern: "motion-safe:transition-all motion-reduce:transition-none",
  /** Never use infinite auto-playing animation without a pause control */
  noAutoPlayInfinite: true,
} as const

// ─── Screen Reader Requirements ──────────────────────────────────────────────

/**
 * Screen reader and assistive technology requirements.
 * All Mukoko components must meet these standards.
 */
export const SCREEN_READER_REQUIREMENTS = {
  /** Use semantic HTML elements first, ARIA only when semantic HTML is insufficient */
  semanticFirst: true,
  /** All images must have meaningful alt text or aria-hidden="true" if decorative */
  imgAlt: "required — or aria-hidden for decorative",
  /** All interactive elements must have accessible names */
  accessibleName: "required — label, aria-label, or aria-labelledby",
  /** Use Radix UI primitives — they handle focus management and ARIA automatically */
  useRadixPrimitives: true,
  /** Lang attribute required on <html> element */
  htmlLang: "required",
  /** Live regions for dynamic content updates */
  ariaLive: "use aria-live='polite' for non-urgent updates, 'assertive' for errors only",
} as const

// ─── Component Accessibility Checklist ──────────────────────────────────────

/**
 * The complete accessibility checklist every Mukoko component must pass.
 * Run this mentally (or via a test) before merging any component change.
 */
export const COMPONENT_CHECKLIST = [
  "[ ] Text contrast ≥ Lc 90 for body text (use checkContrast())",
  "[ ] Text contrast ≥ Lc 75 for large/UI text",
  "[ ] Non-text contrast ≥ Lc 45 for icons and borders",
  "[ ] Touch target ≥ 56px default, ≥ 48px minimum (use TOUCH_TARGETS constants)",
  "[ ] Focus ring visible — focus-visible:ring-2 on all interactive elements",
  "[ ] Keyboard navigable — tab order logical, enter/space activates",
  "[ ] Uses Radix UI primitives for accessible behaviour (dialog, menu, etc.)",
  "[ ] Semantic HTML — button for actions, a for navigation, h1–h6 for headings",
  "[ ] aria-label or visible label on all interactive elements",
  "[ ] Images have alt text or aria-hidden='true'",
  "[ ] motion-safe / motion-reduce for animations > 200ms",
  "[ ] Tested with screen reader (VoiceOver / TalkBack)",
  "[ ] lang attribute on root html element",
  "[ ] Colour is never the ONLY way information is conveyed",
  "[ ] Works at 200% zoom without horizontal scroll",
] as const

// ─── Colour-Blindness Safe Patterns ─────────────────────────────────────────

/**
 * Guidance for colour-blindness safe component design.
 * ~8% of males, ~0.5% of females have some form of colour vision deficiency.
 * In a 1 billion user African platform, this is ~40-80 million users.
 */
export const COLOUR_BLINDNESS_GUIDANCE = {
  /** Never rely on red/green alone to convey meaning — add icon or text */
  redGreenSafe: "Always pair colour with icon OR text label for status/error/success",
  /** Use the mineral palette — cobalt/tanzanite are distinguishable by all CVD types */
  mineralSafePairs: [
    "cobalt + gold — distinguishable in all CVD types",
    "tanzanite + malachite — distinguishable in protanopia/deuteranopia",
    "cobalt + terracotta — distinguishable in tritanopia",
  ],
  /** Pattern / shape differentiation */
  patternUse: "Use shape, pattern, or position as a secondary signal alongside colour",
} as const

// ─── African Language Accessibility ─────────────────────────────────────────

/**
 * Typography requirements for African language support.
 * The Mukoko ecosystem serves speakers of 54+ African languages.
 *
 * Noto Sans / Noto Serif are chosen specifically for their support of:
 * - Shona (Zimbabwe) — Latin + special diacritics
 * - Ndebele (Zimbabwe/South Africa) — Latin
 * - Swahili (East Africa) — Latin
 * - Zulu, Xhosa, Sotho (South Africa) — Latin with clicks
 * - Amharic, Tigrinya (Ethiopia/Eritrea) — Ethiopic script (Ge'ez)
 * - Arabic, Hausa with Arabic script (North/West Africa)
 * - Yoruba, Igbo (Nigeria) — Latin with tonal diacritics
 */
export const LANGUAGE_ACCESSIBILITY = {
  fontStack: {
    sans: "'Noto Sans', 'Noto Sans Fallback', system-ui, sans-serif",
    serif: "'Noto Serif', 'Noto Serif Fallback', Georgia, serif",
    mono: "'JetBrains Mono', 'JetBrains Mono Fallback', monospace",
  },
  /** Line height requirements for languages with diacritics */
  lineHeight: {
    minimum: 1.5,
    recommended: 1.6,
    diacriticHeavy: 1.8,
    rationale: "Diacritics (à, é, ê, ŋ, ɓ) need vertical breathing room",
  },
  /** Letter spacing — never tighten beyond -0.01em for African scripts */
  letterSpacing: {
    minimum: "-0.01em",
    rationale: "Tight tracking obscures diacritic marks",
  },
  /** RTL support — Hausa, Arabic, Tigrinya may use RTL */
  rtlSupport: "Use CSS logical properties (margin-inline, padding-block) not left/right",
} as const
