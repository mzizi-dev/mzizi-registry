import { NextResponse } from "next/server"

/**
 * GET /.well-known/security.txt
 *
 * RFC 9116 security contact disclosure.
 * https://securitytxt.org/
 *
 * EVERY URL HERE IS TESTED, because this file previously advertised three that were not:
 *
 *   Contact          github.com/nyuchi/design-portal/security/advisories/new   403 — wrong repo
 *   Policy           mzizi.dev/security                                        404
 *   Acknowledgments  mzizi.dev/security/acknowledgments                        404
 *
 * A security.txt is read by exactly one kind of person: someone who has found a
 * vulnerability and is trying to tell us before they tell anyone else. Sending them to a
 * 404 spends the goodwill that got them here, and it advertises a disclosure process that
 * does not exist — which is worse than publishing no file at all, because a missing file
 * reads as "not set up yet" while a broken one reads as "set up and ignored".
 *
 * `Policy` now points at SECURITY.md in the repository, which exists and is the actual
 * policy. `Acknowledgments` is REMOVED rather than repointed: there is no acknowledgments
 * page, and RFC 9116 makes the field optional. Absent is honest; a link to nothing is not.
 *
 * `__tests__/api/security-txt.test.ts` asserts the shape offline, and every URL was checked
 * by hand against production before this landed.
 */
export async function GET() {
  // Expires: 1 year from build time — update on each release
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  const body = `Contact: mailto:security@nyuchi.com
Contact: https://github.com/nyuchi/mzizi/security/advisories/new
Expires: ${expires.toISOString()}
Canonical: https://mzizi.dev/.well-known/security.txt
Policy: https://github.com/nyuchi/mzizi/blob/main/SECURITY.md
Preferred-Languages: en
`

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
