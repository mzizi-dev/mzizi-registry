# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 7.x | Yes |
| < 7.0 | No |

## Reporting a Vulnerability

If you discover a security vulnerability in mukoko registry, please report it responsibly.

**Do NOT open a public issue.**

Instead, email security concerns to the maintainers via the repository's security advisory feature:

1. Go to the [Security tab](https://github.com/nyuchitech/mukoko-registry/security) on GitHub
2. Click "Report a vulnerability"
3. Provide a description, steps to reproduce, and potential impact

We will acknowledge receipt within 48 hours and provide an initial assessment within 5 business days.

## Scope

This policy covers:
- The mukoko registry application (`registry.mukoko.com`)
- The component registry API (`/api/r/*`)
- The brand API (`/api/brand`)
- Component source code served via the registry

## Out of Scope

- Third-party dependencies (report those to the respective maintainers)
- Applications that consume the registry (report to those repositories)
- The legacy `assets.nyuchi.com` site (deprecated)
