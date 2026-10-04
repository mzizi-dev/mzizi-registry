An on/off toggle for settings that apply immediately — 32×18.4px, a pill.

Hand-written from `components/registry/n2-primitives/switch.tsx` (Radix Switch; `.mz-switch`).

**Props**: `size` = `default | sm (24×14)`, plus Radix `checked`, `onCheckedChange` and `disabled`. The consumer provides the label next to it.

**States**: on → `primary` track, thumb in `background` (in dark, `primary-foreground`). Off → `input` track. An invisible hit area extends the target to meet `touch-min`.
