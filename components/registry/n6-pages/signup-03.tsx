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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "@/lib/icons"

const features = [
  "Production-ready component registry",
  "Seven African Minerals design system",
  "Accessible and theme-aware",
  "Install via shadcn CLI",
]

function Signup03() {
  const { motion } = useNyuchiHarness("signup-03")
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
      data-slot="signup-03"
      style={animStyle}
      data-portal="https://mzizi.dev/components/signup-03"
      role="form"
      aria-label="Create account"
      className="flex min-h-screen bg-background"
    >
      {/* Left — features */}
      <div className="hidden flex-1 flex-col justify-center bg-card p-12 lg:flex">
        <h2 className="mb-2 font-serif text-3xl font-semibold text-foreground">
          Build faster with mukoko
        </h2>
        <p className="mb-8 max-w-md text-sm text-muted-foreground">
          Join thousands of developers building pan-African products with our design system.
        </p>
        <ul className="space-y-4">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-malachite/15">
                <Check className="size-3.5 text-malachite" />
              </div>
              <span className="text-sm text-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center border-l border-border px-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Create an account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start building in minutes</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup03-name">Full name</Label>
              <Input id="signup03-name" placeholder="Tanya Moyo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup03-email">Email</Label>
              <Input id="signup03-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup03-password">Password</Label>
              <Input id="signup03-password" type="password" placeholder="8+ characters" />
            </div>
            <Button className="w-full">Get started</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <a href="#" className="font-medium text-foreground hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export { Signup03 }
