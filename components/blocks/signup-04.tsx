"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Lock } from "lucide-react"

function Signup04() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-gold/10">
            <Lock className="size-6 text-gold" />
          </div>
          <CardTitle className="font-serif text-xl">Invite only</CardTitle>
          <CardDescription>
            Enter your invitation code to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup04-code">Invitation code</Label>
            <Input
              id="signup04-code"
              placeholder="XXXX-XXXX-XXXX"
              className="text-center font-mono tracking-wider"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="signup04-email">Email</Label>
            <Input id="signup04-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="signup04-first">First name</Label>
              <Input id="signup04-first" placeholder="Tanya" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup04-last">Last name</Label>
              <Input id="signup04-last" placeholder="Moyo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup04-password">Password</Label>
            <Input id="signup04-password" type="password" placeholder="Create a password" />
          </div>
          <Button className="w-full">Activate account</Button>
          <p className="text-center text-xs text-muted-foreground">
            Need an invite?{" "}
            <a href="#" className="text-cobalt hover:underline">Request access</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export { Signup04 }
