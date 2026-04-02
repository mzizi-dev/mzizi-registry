# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 4.x | Yes |
| < 4.0 | No |

## Reporting a Vulnerability

If you discover a security vulnerability in Mukoko Registry, please report it responsibly.

**Do NOT open a public issue.**

Instead, use GitHub's security advisory feature:

1. Go to the [Security tab](https://github.com/nyuchitech/mukoko-registry/security/advisories) on GitHub
2. Click "Report a vulnerability"
3. Provide a description, steps to reproduce, and potential impact
4. Include the affected version(s) and any relevant configuration details

## Response Timeline

- **Acknowledgment:** Within 48 hours of submission
- **Initial assessment:** Within 5 business days
- **Fix timeline:** Determined during assessment based on severity

## Scope

This policy covers:

- The Mukoko Registry application (`registry.mukoko.com`)
- The component registry API (`/api/v1/*`)
- The MCP server (`/mcp`)
- The brand API (`/api/v1/brand`)
- The Supabase backend (database layer, seed scripts, service role access)
- Component source code served via the registry

## Out of Scope

- Third-party dependencies (report those to the respective maintainers)
- Applications that consume the registry (report to those repositories)
