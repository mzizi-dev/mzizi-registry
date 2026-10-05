The content surface — a `card` panel with the 14px `radius-lg` corner and a 1px hairline ring.

Hand-written from `components/registry/n2-primitives/card.tsx` (`.mz-card` and its parts).

**Parts**: `Card` (`size` = `default | sm`, `loading` for a pulse skeleton), `CardHeader`, `CardTitle` (16px medium), `CardDescription` (14px `muted-foreground`), `CardAction` (top-right slot), `CardContent`, `CardFooter`.

## Rules

- Padding is 24px (`space-lg`), or 16px for `sm`. The gap between parts is 24px (16px for `sm`).
- Border is a ring of `foreground` at 10%, not a shadow.
- An image as the first child goes edge to edge, with `radius-md` top corners.
- Cards sit on `background`, which carries the dot grid. The card itself is opaque.
