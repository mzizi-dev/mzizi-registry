A pill-shaped lifecycle label (`stable`, `beta`, `alpha` or `deprecated`), each status tinted with one of the Seven Minerals.

Hand-written from `components/registry/n2-primitives/status-badge.tsx` (`.mz-status`). The component ships in three builds with one contract: `status-badge.tsx` (React, built on Badge), `status-badge.rs` (Mzizi Roots, in `mzizi-ui`) and `status-badge.mz` (the Mzizi language).

**Props**: `status` = `stable | beta | alpha | deprecated`. Children (or `label` in the `.mz`) override the label, which is otherwise the status itself.

## Rules

- Statuses map to minerals: stable → `malachite`, beta → `cobalt`, alpha → `gold`, deprecated → `terracotta`, struck through. Each uses its mineral at 10% as the fill and the full mineral as the text, in 10px mono uppercase.
- The word is always shown, so status never depends on colour alone.
- It is not interactive. Wrapped in a link, it inherits the link's hit area.
