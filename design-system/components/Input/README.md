A single-line text field — a 48px pill, to match the buttons.

Hand-written from `components/registry/n2-primitives/input.tsx` (`.mz-input` in `bundle.css`).

**Use** with a `label` above it (weight 500, 14px). The consumer provides the label, `placeholder`, `type` and value; errors set `aria-invalid="true"`, which turns the border and halo `destructive`.

## Rules

- Height is 48px (`touch-min`), radius `radius-full`, padding `space-base` horizontally.
- Fill is `input` at 30% with a 1px `input` border; placeholder in `muted-foreground`.
- Text is 16px on mobile (stops iOS zoom) and 14px from `md` up.
- Focus: `ring` border + 3px `ring` halo at 50%.
