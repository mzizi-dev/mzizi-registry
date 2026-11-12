---
name: registry-propagation
description: "Use this skill when a change in mzizi-registry has to reach the products that read it, or when someone asks whether a registry change is live. It maps the chain: a registry release on main, then the pins on staging (mzizi-api scripts/registry-ref.json with build:data, parity and PIN_ entries in EXPECTED; mzizi-mcp registry.pin.json; @bundu/ui scripts/registry-ref.json with registry:sync, registry:check and contracts:check), docs (check-freshness.mjs), the site (builds from the API, so verify-rendered.py counts move), and the skills (agent-tools mzizi-skills, then the registry's skills:generate and plugin:skills). It gives the rules (pin a released registry main commit, pins are bumped by PR into staging, parity non-strict into staging and strict into main), the order, what each product shows once live, and a live alignment table to fill with commands. Releasing each repo uses ship-release."
---

# Registry propagation: from a registry release to every product, proven live

> **Covenant:** _A registry change is live in a product when that product says so, not when its PR merges._

`mzizi-dev/mzizi-registry` is the source. The API, the MCP server, `@bundu/ui`, the docs, the
site and the skills each read it a different way, each through its own pin or build. When one
lags, an agent or a visitor gets a different answer depending on which product they ask. This
skill is the map and the proof: the order, the commands, and a table you fill with what you read.

## The chain

```text
mzizi-registry main (a release, e.g. v4.25.0)
   |
   +--> mzizi-api         scripts/registry-ref.json      -> api.mzizi.dev   (build:data, parity)
   +--> mzizi-mcp         mzizi-mcp/registry.pin.json    -> mcp.mzizi.dev   (agent-tools)
   +--> @bundu/ui         scripts/registry-ref.json      -> npm @bundu/ui   (packages-npm; registry:sync)
   |
   +--> mzizi-site        builds from api.mzizi.dev      -> mzizi.dev       (counts in verify-rendered.py)
   +--> mzizi-docs        facts checked against the API  -> docs.mzizi.dev  (check-freshness.mjs)
   |
   +--> skills            agent-tools mzizi-skills (npm) -> the registry's skills:generate and plugin:skills
                                                            -> api /v1/skills, mcp mzizi_get_skills, the plugin
```

Each arrow is a PR on `staging` of the receiving repo, then a release of that repo to `main`
(use the `ship-release` skill). Nothing below is live until that repo's release is live.

## Rules

- **Pin a registry `main` commit that is released.** A pin is a full commit SHA. Read the
  latest release tag and the commit it points at; do not pin a branch tip that is not released,
  and do not pin a commit from a PR branch.
- **In agent-tools the pin is moved by hand, in a PR into `staging`; there is no pin bot.** The
  owner removed it on 4 November 2026 (steps in `mzizi-mcp/README.md`). Other repos may still
  run one: read the repo's `AGENTS.md` and workflows on the branch you act on, read the base
  branch of any bump PR, and report where the bump actually landed. A bump merged only on `main`
  is a commit `staging` lacks and trips the main gate at the next release.
- **Parity in mzizi-api is non-strict on PRs and merge queues into `staging`** (the recorded
  `EXPECTED` differences are honoured, because `staging` is ahead of production; #126) and
  **strict on PRs into `main`** (`EXPECTED` is ignored, so every difference is unexplained;
  a PR that edits `scripts/parity.mjs` is also non-strict). Until a release carries #120 and #126
  to `main`, `main`'s own workflow runs parity only on PRs into `main`. A bump that passes on
  `staging` can still fail the release PR: prune or fix `EXPECTED` before releasing, never edit the
  check to pass.
- **Never skip a gate to land a pin.** A pin that fails a gate means a handler, a count or a
  contract moved: fix that, or stop and report.
- **Pin first, then release, then verify.** Report a product as live only when the table below
  shows its value.

## Order

1. **Registry released.** Read the tag and the commit: `gh api repos/mzizi-dev/mzizi-registry/releases/latest --jq .tag_name`
   and `gh api repos/mzizi-dev/mzizi-registry/commits/main --jq .sha`. Pin the released commit.
2. **API** (mzizi-api, base `staging`). Move `ref` in `scripts/registry-ref.json` (and `pinned`,
   `note`). Then:

   ```bash
   npm ci
   npm run build:data      # clones the pinned registry, writes src/data/*.json
   npm run typecheck && npm run check && npm test
   npm run dev             # in a second shell: wrangler dev on http://localhost:8787
   npm run parity          # live api.mzizi.dev against that candidate; `npm run parity -- --strict` ignores EXPECTED
   ```

   An intentional difference goes into `EXPECTED` in `scripts/parity.mjs` as a `PIN_<sha>`
   constant (the first characters of the commit) with its reason, and into the PR body. Add a
   `CHANGELOG.md` entry saying what a caller of the API sees differently.

3. **MCP** (agent-tools, base `staging`). Move `ref` in `mzizi-mcp/registry.pin.json`; run
   `pnpm --filter @nyuchi/mzizi-mcp generate` (or the package's `test`) so the bundled data
   rebuilds, and fix any test that counts registry data. A change to what the MCP serves is a
   package version bump (next minor above npm) and a CHANGELOG section.
4. **`@bundu/ui`** (packages-npm, base `staging`). Move `ref` in `scripts/registry-ref.json`, then:

   ```bash
   pnpm install --frozen-lockfile
   pnpm registry:sync          # rebuild the components from the pin
   pnpm contracts:fetch        # refresh packages/bundu-ui/contracts/
   pnpm registry:check && pnpm contracts:check && pnpm tokens:check
   pnpm test
   ```

   Generated files are never hand-edited. The package version is the next minor above npm,
   with a CHANGELOG section; the release publishes it.

5. **Skills.** A skills change starts in agent-tools `mzizi-skills` (a release to npm, see
   `ship-release`). The registry then takes it: its `@nyuchi/mzizi-skills` range lets
   `pnpm skills:generate` and `pnpm plugin:skills` regenerate the bundled copies (check with
   `pnpm skills:generate:check` and `pnpm plugin:skills:check`). The API serves skills through
   the registry's dependency and its pin, the MCP bundles them from agent-tools at build time,
   and the public plugin carries the generated copy. A skills release is done only when npm,
   the MCP and the API all serve it.
6. **Site** (mzizi-site, base `staging`). It builds from the live API, so its counts move
   when the API changes and the rendered gate fails on every branch until they are updated:
   `python3 scripts/verify-rendered.py dist` (after `pnpm build`). Update the expected numbers
   there and the same counts in `AGENTS.md` and `README.md`, with a CHANGELOG entry. Move the
   `@bundu/ui` range in `package.json` when a new version should land (`npm view @bundu/ui version`).
7. **Docs** (mzizi-docs, base `staging`). Run `node scripts/check-freshness.mjs` (network),
   update the pages it names, keep the sentence shapes it matches (or update the script in the
   same change), and add a `CHANGELOG.md` entry naming the facts and pages that moved.
8. **Release each repo** with `ship-release`, in the order the data flows: API, MCP and
   `@bundu/ui` first, then the site and docs that read them.

## What each product shows once live

| Product | Live signal                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------ |
| API     | `x-mzizi-source: mzizi-api-gateway; registry=<sha>` on every response; new fields in `/v1/brand` |
| MCP     | `catalogue.json`: `version`, `source.registry` (the commit), `skills.version`                    |
| Skills  | npm `latest`; `catalogue.json` `skills.version`; `/v1/skills` `meta.version`                     |
| UI      | npm `@bundu/ui` `latest`; the pin file on `main` equals the commit you pinned                    |
| Site    | the built page shows the new counts; `verify-rendered.py` passes on `main`                       |
| Docs    | `check-freshness.mjs` reports no drift against the live sources                                  |

For the Bundu floor in 4.23.0 and the spacing floor in 4.24.0, the signal in `/v1/brand` is the
`accessibility` block: `minTouchTarget`, `defaultTouchTarget`, `minInset`, `minControlGap`,
`minLabelGap`, `minItemGap` and `minBodyLeading` present and not null.

## Live alignment check

Fill one row per product, with the value you read in this session. A row with no value is
"not checked", never "aligned". Expected is the registry release's commit (first 12 characters
of the SHA) or the version the release carried. Cloudflare deploys lag a minute or two after a
merge to `main`, so read again before calling a row stale.

```bash
V=node_modules/@nyuchi/mzizi-skills/skills/ship-release/verify-live.sh   # or fetch it, see ship-release
gh api repos/mzizi-dev/mzizi-registry/commits/main --jq '.sha[0:12]'
```

| Product      | Where its version or pin is read                                 | Expected                  | Command                                                                                                         |
| ------------ | ---------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Registry     | latest release tag and the commit it points at                   | the release being shipped | `gh api repos/mzizi-dev/mzizi-registry/releases/latest --jq .tag_name`                                          |
| API live     | `x-mzizi-source` header                                          | `registry=<sha>`          | `curl -sI https://api.mzizi.dev/v1/brand \| grep -i x-mzizi-source`                                             |
| API pin      | `scripts/registry-ref.json` `ref` on `main` and on `staging`     | the released commit       | `gh api "repos/mzizi-dev/mzizi-api/contents/scripts/registry-ref.json?ref=main" --jq .content \| base64 -d`     |
| MCP live     | `catalogue.json` `source.registry` and `version`                 | the released commit       | `bash "$V" mcp`                                                                                                 |
| MCP pin      | `mzizi-mcp/registry.pin.json` `ref` on `main`                    | the released commit       | `gh api "repos/mzizi-dev/agent-tools/contents/mzizi-mcp/registry.pin.json?ref=main" --jq .content \| base64 -d` |
| UI pin       | `scripts/registry-ref.json` `ref` in packages-npm                | the released commit       | `gh api "repos/mzizi-dev/packages-npm/contents/scripts/registry-ref.json?ref=main" --jq .content \| base64 -d`  |
| UI on npm    | `@bundu/ui` `latest`                                             | the version that was cut  | `npm view @bundu/ui version`                                                                                    |
| Skills (npm) | `@nyuchi/mzizi-skills` `latest`                                  | the version that was cut  | `npm view @nyuchi/mzizi-skills version`                                                                         |
| Skills (MCP) | `catalogue.json` `skills.version`                                | the same version          | `curl -s https://mcp.mzizi.dev/catalogue.json \| grep -o '"skills":{"version":"[^"]*"'`                         |
| Skills (API) | `/v1/skills` `meta.version` (it can lag npm: it follows the pin) | the same version          | `curl -s https://api.mzizi.dev/v1/skills \| grep -o '"meta":{[^}]*}'`                                           |
| Components   | `/v1/ui` `meta.total` (the count the site and docs state)        | the registry's count      | `curl -s https://api.mzizi.dev/v1/ui \| grep -o '"meta":{"total":[0-9]*'`                                       |
| Site         | the rendered gate on `main`, and the page itself                 | counts equal the API's    | `python3 scripts/verify-rendered.py dist` (in mzizi-site, after `pnpm build`)                                   |
| Docs         | the freshness check                                              | no drift                  | `node scripts/check-freshness.mjs` (in mzizi-docs; needs the network)                                           |

Read the pin files from `main` for what is live and from `staging` for what is queued; if
they differ, the release is still to do. A pin on `main` that equals the header the API serves
is the proof that API deploy finished.

## Do not

- Do not pin an unreleased registry commit, or edit generated data (`src/data/`,
  `packages/bundu-ui` components, the plugin's `skills/`) by hand: change the source or the pin.
- Do not loosen parity, a count or a contract check to pass; fix the cause or stop.
- Do not claim a product is live from a merged PR. Read the header, the catalogue or npm.

## Checklist

- [ ] The registry commit is a released one; its tag and SHA are written down.
- [ ] Each receiving repo has a `staging` PR with the new pin, its generator or build run, its gates green and a CHANGELOG entry.
- [ ] Parity on the API PR: non-strict into `staging`, strict into `main`, with `PIN_<sha>` entries pruned or recorded.
- [ ] Each repo released with `ship-release`, data producers before the site and docs.
- [ ] The live alignment table is filled with values read this session; a row not read says "not checked".
