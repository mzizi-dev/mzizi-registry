/**
 * @nyuchi/design-cli — public entry point.
 *
 * Re-exports the command handlers so consumers (tests, programmatic
 * embedders, future GUI tooling) can call them directly without going
 * through the CLI binary. The bin/cli.js shim parses argv and dispatches
 * to these.
 */
export { runInit } from "./commands/init.js"
export { runAdd } from "./commands/add.js"
export { runSkillsInstall, runSkillsUpdate } from "./commands/skills.js"

export const VERSION = "0.1.0"
