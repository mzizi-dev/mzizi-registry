/** `s` as a literal inside a RegExp: every metacharacter, backslash included, is escaped. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
