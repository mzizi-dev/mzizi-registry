import Link from "next/link"
import { cookies } from "next/headers"
import { authenticateSessionJwt, isStytchConfigured, STYTCH_SESSION_JWT_COOKIE } from "@/lib/stytch"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "fundi — observability dashboard",
  description: "Manage Fundi observability for your organisation.",
}

/**
 * Fundi dashboard — landing page. Shows the signed-in member +
 * organisation, plus links into the parts of the service.
 *
 * The middleware has already redirected unauthenticated requests to
 * `/fundi/login` before we reach this component, so by the time we
 * render here we expect a valid session cookie. We still call
 * `authenticateSessionJwt()` server-side as defence-in-depth — a
 * forged or expired cookie that bypassed the cookie-presence check
 * gets caught here.
 */
export default async function FundiDashboardPage() {
  if (!isStytchConfigured()) {
    return <NotConfiguredState />
  }

  const cookieStore = await cookies()
  const jwt = cookieStore.get(STYTCH_SESSION_JWT_COOKIE)?.value
  const session = jwt ? await authenticateSessionJwt(jwt) : null

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl font-bold">Session expired</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your sign-in is no longer valid.{" "}
          <Link href="/fundi/login" className="underline underline-offset-4">
            Sign in again
          </Link>
          .
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          FUNDI · OBSERVABILITY-AS-A-SERVICE
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold">{session.organizationName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {session.name ?? session.email}
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <DashboardCard
          title="Active issues"
          description="Open + in-progress fundi issues across all your apps."
          href="/fundi/issues"
        />
        <DashboardCard
          title="Healing log"
          description="Audit trail of every healing action attempted."
          href="/fundi/healing"
        />
        <DashboardCard
          title="Reporters"
          description="Apps configured to report to this organisation."
          href="/fundi/reporters"
        />
        <DashboardCard
          title="Members"
          description="Manage team members + roles in this organisation."
          href="/fundi/members"
        />
      </section>

      <p className="mt-12 text-xs text-muted-foreground">
        Dashboard sections are under construction. The fundi REST API is live at{" "}
        <Link href="/api/v1/fundi" className="underline underline-offset-4">
          /api/v1/fundi
        </Link>{" "}
        and is the canonical interface today.
      </p>
    </main>
  )
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-muted/40"
    >
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}

function NotConfiguredState() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="font-mono text-xs tracking-widest text-muted-foreground">FUNDI</p>
      <h1 className="mt-2 font-serif text-3xl font-bold">Not configured</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        The fundi dashboard requires Stytch B2B auth. Set{" "}
        <code className="font-mono text-xs">STYTCH_PROJECT_ID</code>,{" "}
        <code className="font-mono text-xs">STYTCH_SECRET</code>, and{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN</code> on the
        deployment, then redeploy.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Until then, the underlying REST API at{" "}
        <Link href="/api/v1/fundi" className="underline underline-offset-4">
          /api/v1/fundi
        </Link>{" "}
        remains live and can be queried directly.
      </p>
    </main>
  )
}
