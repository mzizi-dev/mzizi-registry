"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

const features = [
  "82 production-ready components",
  "Five African Minerals design system",
  "Accessible and theme-aware",
  "Install via shadcn CLI",
]

function Signup03() {
  return (
    <div className="flex min-h-screen bg-background">
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
            <a href="#" className="font-medium text-foreground hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export { Signup03 }
