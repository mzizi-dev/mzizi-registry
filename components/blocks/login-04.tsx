"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

function Login04() {
  const [sent, setSent] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
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
