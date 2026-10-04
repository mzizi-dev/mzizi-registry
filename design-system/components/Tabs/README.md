Switches between views inside the same page — a 56px pill list on `muted`, or an underline list.

Hand-written from `components/registry/n2-primitives/tabs.tsx` (Radix Tabs; `.mz-tabs-list`, `.mz-tab`).

**Parts**: `Tabs` (`orientation`), `TabsList` (`variant` = `default | line`), `TabsTrigger`, `TabsContent`.

## Rules

- Default list: a `radius-full` pill, 4px padding, and the active trigger on `background`. In vertical orientation the list uses `radius-xl` (17px).
- `line`: no fill, and a 2px `foreground` underline under the active trigger.
- Inactive triggers use `foreground` at 60%, going to full on hover.
