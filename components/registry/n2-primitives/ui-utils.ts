import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Tailwind-merge configured for Mzizi's custom type
 * scale. Without this, merge treats the named font sizes (`text-body`,
 * `text-h2`, …) as *colours* and drops a legitimately co-existing
 * `text-primary-foreground`. Declaring them in the `font-size` group
 * keeps colour + size independent, the way raw Tailwind generates them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "display-sm",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "body-lg",
            "body",
            "body-sm",
            "caption",
          ],
        },
      ],
    },
  },
});

/**
 * `cn` — the shadcn class-merge helper Mzizi is built
 * on. Merges conditional class lists (clsx) and resolves Tailwind
 * conflicts last-wins (tailwind-merge). Every UI component composes its
 * variant classes through this.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Text as an HTML `pattern` that matches exactly that text: regex syntax is
 * escaped for the `v` flag browsers compile `pattern` with (a hyphen stays
 * bare, since `\-` is an error there). For "type DELETE to confirm".
 */
export function exactPattern(text: string): string {
  return text.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&")
}

/**
 * Up to two initials for a name ("Tendai Moyo" → "TM", "rudo" → "R"), for an
 * avatar with no image. Letters of any script; empty when the name has none.
 */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? "")
    .join("")
    .toLocaleUpperCase()
}
