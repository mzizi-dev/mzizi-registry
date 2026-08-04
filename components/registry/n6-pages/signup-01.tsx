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

function Signup01() {
  const { motion } = useNyuchiHarness("signup-01")
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
      data-slot="signup-01"
      style={animStyle}
      data-portal="https://mzizi.dev/components/signup-01"
      role="form"
      aria-label="Create account"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-xl">Create your account</CardTitle>
          <CardDescription>Get started with mukoko in seconds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="signup01-first">First name</Label>
              <Input id="signup01-first" placeholder="Tanya" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup01-last">Last name</Label>
              <Input id="signup01-last" placeholder="Moyo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup01-email">Email</Label>
            <Input id="signup01-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup01-password">Password</Label>
            <Input id="signup01-password" type="password" placeholder="Create a password" />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>
          <Button className="w-full">Create account</Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="#" className="font-medium text-foreground hover:underline">
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export { Signup01 }
