# mukoko-design: where each file comes from

Every file below is copied byte for byte, never redrawn. `scripts/mukoko-design.test.sh` (run by `pnpm --filter @nyuchi/mzizi-skills test`) fails when a file's SHA-256 stops matching this table, or when a file here is not listed.

- **live**: `public/<file>` in [`mukoko-dev/mukoko-news`](https://github.com/mukoko-dev/mukoko-news) at `c7d17fa` (2026-11-01), the source of truth for the mark and the icons. Change it there first, then copy.
- **history**: this skill's last version before 0.8.0 (agent-tools `4d2b905^`), carried over unchanged because no live surface ships it.

| File                                               | Source                                                      | SHA-256                                                            |
| -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `app-icon/mukoko-appicon-paper.png`                | live: `public/mukoko-appicon-paper.png`                     | `b468bd2edb18ea0306774fab5c62549b6104c4cb4ca78940b2c89924fac370b6` |
| `app-icon/mukoko-appicon.png`                      | live: `public/mukoko-appicon.png`                           | `89a90682251b327a4af0a19134a1292d9a34f26637f8a14ff6f45d454d43bd4b` |
| `backgrounds/honeycomb-grain-paper.svg`            | history: `backgrounds/honeycomb-grain-paper.svg`            | `369e5bc7e6d697b8da53ce42805f794bb86c7471e73c62e39a37d370ca76d777` |
| `backgrounds/honeycomb-pattern-full.svg`           | history: `backgrounds/honeycomb-pattern-full.svg`           | `ace06772c4c27ced0c2acb9049af20f4aa7a906784f14e22ada3a0ac3baae35e` |
| `backgrounds/honeycomb-splash-stone-1080x1920.png` | history: `backgrounds/honeycomb-splash-stone-1080x1920.png` | `e602806302f11a2e0656f894f0558ddb1f9a3f369c3e1dbb00e7282bb067a18a` |
| `backgrounds/honeycomb-splash-stone.svg`           | history: `backgrounds/honeycomb-splash-stone.svg`           | `03fb4130caa4b9cf4446ac6490aeb1fba8849a7bf0a85c2213d6decbd708eafc` |
| `backgrounds/honeycomb-tanzanite-header.svg`       | history: `backgrounds/honeycomb-tanzanite-header.svg`       | `6a7391e2311d894990614ab437298e6373a01abf80d6cb3b677007733b606d71` |
| `favicon/apple-touch-icon.png`                     | live: `public/apple-touch-icon.png`                         | `45913f352bb9814731d8b7673362e772b333b77e6dee8503d92ed885374e1b8a` |
| `favicon/favicon-16.png`                           | live: `public/favicon-16.png`                               | `bf47306ede458717f2aced0f2e8100d31416a4a52d0edcaa7904d30b40c6aa18` |
| `favicon/favicon-32.png`                           | live: `public/favicon-32.png`                               | `f7f0e44db9fb572d22178650fbcc4f2c07b3dfdea0fc600f3ed7684112b4a07e` |
| `favicon/favicon.ico`                              | live: `public/favicon.ico`                                  | `5c84a6138d3b6ef0dda733e90c85ba1a432ce3d5ac0de4b9d05eaf7cebb2e116` |
| `favicon/favicon.svg`                              | live: `public/favicon.svg`                                  | `18661e7ed1e2cef2d1a47ebf869c3bde9bfc9aa65a4d8ea3381d0376c55627a1` |
| `lockup/mukoko-lockup-dark.svg`                    | live: `public/mukoko-lockup-dark.svg`                       | `db28f5bb716875374d9925d7cadf7edf26e25a302816347d3e8a1a50b0bca773` |
| `lockup/mukoko-lockup-light.svg`                   | live: `public/mukoko-lockup-light.svg`                      | `111a639c6631b8694f149732cf4a3bade5a6593257f96c020c0daa9fab526e0d` |
| `mark/mukoko-mark-full-dark.svg`                   | live: `public/mukoko-mark-full-dark.svg`                    | `c3c533a3aba9ef64469a008aecd5a100a54dfac50bdbed882a125eb71022dc1c` |
| `mark/mukoko-mark-full-light.svg`                  | live: `public/mukoko-mark-full-light.svg`                   | `49ec4f0a9b991714ec0a0962a37c27d83eaeac49ab56e86b609535b945b3892a` |
