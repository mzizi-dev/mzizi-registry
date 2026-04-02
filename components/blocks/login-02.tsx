"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function Login02() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — image */}
      <div className="hidden flex-1 items-center justify-center bg-muted lg:flex">
        <div className="space-y-4 px-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-cobalt/10">
            <span className="font-serif text-2xl font-bold text-cobalt">m</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">mukoko</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            The pan-African platform connecting communities through technology, culture, and shared purpose.
          </p>
          <div className="flex justify-center gap-1.5 pt-2">
            <span className="size-2 rounded-full bg-cobalt" />
            <span className="size-2 rounded-full bg-tanzanite" />
            <span className="size-2 rounded-full bg-malachite" />
            <span className="size-2 rounded-full bg-gold" />
            <span className="size-2 rounded-full bg-terracotta" />
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login02-email">Email</Label>
              <Input id="login02-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login02-password">Password</Label>
              <Input id="login02-password" type="password" placeholder="Enter your password" />
            </div>
            <Button className="w-full">Sign in</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <a href="#" className="font-medium text-foreground hover:underline">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export { Login02 }
