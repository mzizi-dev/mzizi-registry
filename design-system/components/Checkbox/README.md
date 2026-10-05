A 16px box for multi-select options and consent, with the 7px `radius-sm` corner.

Hand-written from `components/registry/n2-primitives/checkbox.tsx` (Radix Checkbox; `.mz-check`).

**Props**: Radix `checked` (`true | false | "indeterminate"`), `onCheckedChange`, `disabled`. The consumer provides the label.

**States**: checked → `primary` fill with a `primary-foreground` check. Unchecked → a 1px `input` border.

**Contrast flag**: `input` is 6% ink, so the unchecked border falls well below 3:1 in both themes. It is kept exactly as the source ships it. Consider a stronger border token upstream.
