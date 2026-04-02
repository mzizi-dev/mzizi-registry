"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function Login01() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
              <a href="#" className="text-xs text-cobalt hover:underline">Forgot password?</a>
            </div>
            <Input id="login01-password" type="password" placeholder="Enter your password" />
          </div>
          <Button className="w-full">Sign in</Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <a href="#" className="font-medium text-foreground hover:underline">Sign up</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export { Login01 }
