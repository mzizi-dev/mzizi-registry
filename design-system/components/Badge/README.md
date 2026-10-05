A small label for counts, categories and metadata — 20px tall, 12px medium text.

Hand-written from `components/registry/n2-primitives/badge.tsx` (`.mz-badge`).

**Variants**: `default`, `secondary`, `outline`, `destructive`, `ghost`, `link`. The consumer supplies the text and, optionally, a 12px icon.

**Note**: the brand spec says badges are pill-shaped, but the primitive ships `rounded-md` (12px). Pass `className="rounded-full"` where a pill is wanted.
