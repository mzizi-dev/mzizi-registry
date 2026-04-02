"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function Signup01() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
            <a href="#" className="font-medium text-foreground hover:underline">Sign in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export { Signup01 }
