The primary action control — always a pill, 56px tall by default, 48px at its smallest.

Hand-written from `components/registry/n2-primitives/button.tsx`; the preview is a static rendition in `bundle.css` (`.mz-btn`).

**Use** for any action. One `default` (primary ink) button per view; `secondary` or `outline` for the rest; `ghost` in toolbars and dense rows; `link` inline in prose; `destructive` only for irreversible actions (it is a 10% destructive tint with destructive text, never a solid red block). `brand-accent` fills are for per-brand CTAs only.

**Props** (React source): `variant` = `default | outline | secondary | ghost | destructive | link`; `size` = `default (h-14, px-5) | sm (h-12, px-4) | lg (h-14, px-6) | icon (56×56) | icon-sm (48×48)`; `asChild` to render a link through Radix Slot. Icons: add `data-icon="inline-start|inline-end"` to tighten the padding on that side.

## Rules

- Radius is always `radius-full`. Never square a button.
- Never go below `touch-min` (48px).
- Focus: `ring` border plus a 3px `ring` halo at 50%.
- Disabled: 50% opacity, no pointer events.
