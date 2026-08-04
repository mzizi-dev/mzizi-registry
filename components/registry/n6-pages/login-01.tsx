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

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
import { useNyuchiHarness } from "@/lib/harness"

function Login01() {
  const { motion, LiveRegion } = useNyuchiHarness("login-01")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  return (
    <div
      data-slot="login-01"
      style={animStyle}
      data-portal="https://mzizi.dev/components/login-01"
      role="form"
      aria-label="Sign in"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      {LiveRegion}
      <Card className="w-full max-w-sm">
        {/* Mineral accent stripe */}
        <div className="flex h-1 w-full overflow-hidden rounded-t-2xl">
          <div className="flex-1 bg-cobalt" />
          <div className="flex-1 bg-tanzanite" />
          <div className="flex-1 bg-malachite" />
          <div className="flex-1 bg-gold" />
          <div className="flex-1 bg-terracotta" />
        </div>
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your mukoko account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login01-email">Email</Label>
            <Input id="login01-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login01-password">Password</Label>
              <a href="#" className="text-xs text-cobalt hover:underline">
                Forgot password?
              </a>
            </div>
            <Input id="login01-password" type="password" placeholder="Enter your password" />
          </div>
          <Button className="w-full">Sign in</Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <a href="#" className="font-medium text-foreground hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export { Login01 }
