/**
 * Navigation data for the app shell's sidebar and command palette, and the
 * pure helpers behind them. Data-driven on purpose: an app registers a
 * section as one object, and the shell groups, nests and orders it.
 */
import type { IconName } from "./site-icons";

export type { IconName };

export interface NavItem {
  href: string;
  label: string;
  /**
   * One line about the item. Never printed in the sidebar: it is the
   * item's tooltip and accessible description (`aria-describedby`), and a
   * search term in the command palette.
   */
  description?: string;
  /** Kept as an alias of `description` for 0.3 callers. */
  summary?: string;
  icon?: IconName;
  /** A short tag after the label, e.g. "New" or "Beta". */
  badge?: string;
  /** Nested items, shown under a disclosure with a chevron. */
  children?: NavItem[];
  /**
   * When an item with children is a page itself, it is listed first under
   * its disclosure with this label (default "Overview").
   */
  overviewLabel?: string;
}

export interface NavGroup {
  /** A quiet section label above the items; omit for the first group. */
  label?: string;
  items: NavItem[];
}

/** A flat registration, as an app keeps it: one line per section. */
export interface NavEntry extends Omit<NavItem, "children"> {
  /** The group label this entry sits under (e.g. "Content"). */
  group?: string;
  /** The `href` of the entry this one nests under. */
  parent?: string;
}

/** True when `path` is `href` or below it. Query strings are ignored. */
export function isCurrentHref(path: string, href: string): boolean {
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const p = clean(path.split(/[?#]/)[0] ?? "");
  const h = clean(href.split(/[?#]/)[0] ?? "");
  return p === h || (h !== "/" && p.startsWith(`${h}/`));
}

/**
 * The single best match for `path` among every href in the tree: the
 * longest href that is current. So `/dashboard` is not also current on
 * `/dashboard/people` when both are listed.
 */
export function currentHref(path: string, groups: NavGroup[]): string | null {
  let best: string | null = null;
  const visit = (items: NavItem[]) => {
    for (const item of items) {
      if (
        isCurrentHref(path, item.href) &&
        (best === null || item.href.length > best.length)
      ) {
        best = item.href;
      }
      if (item.children) visit(item.children);
    }
  };
  for (const g of groups) visit(g.items);
  return best;
}

/** Whether `item` or any of its descendants is the current href. */
export function containsHref(item: NavItem, href: string | null): boolean {
  if (href === null) return false;
  return (
    item.href === href ||
    (item.children ?? []).some((c) => containsHref(c, href))
  );
}

/**
 * Turn flat registrations into ordered groups with nesting. Groups appear
 * in `order` (labels not listed follow in first-seen order; entries with no
 * group go first, unlabelled). Children attach to the entry whose `href`
 * equals their `parent`; an unknown parent leaves the entry at top level,
 * so a registration never disappears.
 */
export function groupNav(
  entries: readonly NavEntry[],
  order: readonly string[] = [],
): NavGroup[] {
  const byHref = new Map<string, NavItem>();
  const top: { entry: NavEntry; item: NavItem }[] = [];
  for (const entry of entries) {
    const { group: _group, parent: _parent, ...rest } = entry;
    const item: NavItem = { ...rest };
    byHref.set(entry.href, item);
    top.push({ entry, item });
  }
  const roots: { entry: NavEntry; item: NavItem }[] = [];
  for (const t of top) {
    const parent = t.entry.parent ? byHref.get(t.entry.parent) : undefined;
    if (parent && parent !== t.item) {
      parent.children = [...(parent.children ?? []), t.item];
    } else {
      roots.push(t);
    }
  }
  const labels: string[] = [];
  for (const r of roots) {
    const g = r.entry.group ?? "";
    if (g !== "" && !labels.includes(g)) labels.push(g);
  }
  const ordered = [
    ...order.filter((l) => labels.includes(l)),
    ...labels.filter((l) => !order.includes(l)),
  ];
  const groups: NavGroup[] = [];
  const ungrouped = roots.filter((r) => !r.entry.group).map((r) => r.item);
  if (ungrouped.length > 0) groups.push({ items: ungrouped });
  for (const label of ordered) {
    groups.push({
      label,
      items: roots.filter((r) => r.entry.group === label).map((r) => r.item),
    });
  }
  return groups;
}

/** Every item in the tree, depth first, with its group label: the palette's list. */
export function flattenNav(
  groups: NavGroup[],
): (NavItem & { group?: string; trail: string[] })[] {
  const out: (NavItem & { group?: string; trail: string[] })[] = [];
  const visit = (
    items: NavItem[],
    group: string | undefined,
    trail: string[],
  ) => {
    for (const item of items) {
      out.push({ ...item, group, trail });
      if (item.children) visit(item.children, group, [...trail, item.label]);
    }
  };
  for (const g of groups) visit(g.items, g.label, []);
  return out;
}

/** Case- and accent-insensitive match of every word in `query`. */
export function matchesQuery(text: string, query: string): boolean {
  const fold = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const hay = fold(text);
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/** Items whose label, description, group or trail match `query`. */
export function searchNav(groups: NavGroup[], query: string) {
  const q = query.trim();
  return flattenNav(groups).filter(
    (i) =>
      q !== "" &&
      matchesQuery(
        [
          i.label,
          i.description ?? i.summary ?? "",
          i.group ?? "",
          ...i.trail,
        ].join(" "),
        q,
      ),
  );
}
