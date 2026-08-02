/* ═══════════════════════════════════════════════════════════════
   AUTH BLOCK — Layer 6 (Page Composition)
   
   COMPOSITION PATTERN:
   This block should compose L2 primitives (Button, Input, Card, Label)
   and L3 brand components (nyuchi-auth-layout) rather than rendering
   inline UI. The current implementation pre-dates the 3D architecture.
   
   APPROVED FOR USE: Yes, as-is. Refactor is tracked for a future pass.
   The inline code works correctly — the refactor is for architectural
   purity, not functionality.
   ═══════════════════════════════════════════════════════════════ */
"use client"

import * as React from "react"

import { useNyuchiHarness } from "@/lib/harness"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "@/lib/icons"

function Login04() {
  const { motion } = useNyuchiHarness("login-04")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const [sent, setSent] = useState(false)

  return (
    <div
      data-slot="login-04"
      style={animStyle}
      data-portal="https://mzizi.dev/components/login-04"
      role="form"
      aria-label="Sign in"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-tanzanite/10">
            <Mail className="size-6 text-tanzanite" />
          </div>
          <CardTitle className="font-serif text-xl">
            {sent ? "Check your email" : "Sign in with magic link"}
          </CardTitle>
          <CardDescription>
            {sent
              ? "We sent a sign-in link to your email address. Click it to continue."
              : "Enter your email and we'll send you a one-time sign-in link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="login04-email">Email address</Label>
                <Input id="login04-email" type="email" placeholder="you@example.com" />
              </div>
              <Button className="w-full" onClick={() => setSent(true)}>
                Send magic link
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We'll email you a link for a password-free sign in.
              </p>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="login04-otp">Or enter the 6-digit code</Label>
                <Input
                  id="login04-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-[0.5em]"
                />
              </div>
              <Button className="w-full">Verify code</Button>
              <button
                onClick={() => setSent(false)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
              >
                Use a different email
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { Login04 }
