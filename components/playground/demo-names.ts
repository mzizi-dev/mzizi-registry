/**
 * List of component names that have interactive demos.
 * This file is importable from both server and client components.
 * Keep in sync with the keys in demos.tsx.
 */
export const DEMO_NAMES = new Set([
  "accordion",
  "alert",
  "alert-dialog",
  "avatar",
  "badge",
  "button",
  "card",
  "checkbox",
  "dialog",
  "dropdown-menu",
  "input",
  "label",
  "popover",
  "progress",
  "select",
  "separator",
  "skeleton",
  "slider",
  "switch",
  "tabs",
  "textarea",
  "toggle",
  "tooltip",
  "mukoko-sidebar",
  "mukoko-header",
  "mukoko-footer",
  "mukoko-bottom-nav",
  "detail-layout",
  "dashboard-layout",
  "data-table",
  "date-picker",
  "typography",
  "search-bar",
  "user-menu",
  "stats-card",
  "filter-bar",
  "share-dialog",
  "notification-bell",
  "file-upload",
  "copy-button",
  "status-indicator",
  "timeline",
  "pricing-card",
  "rating",
])

export function hasDemoFor(name: string): boolean {
  return DEMO_NAMES.has(name)
}
