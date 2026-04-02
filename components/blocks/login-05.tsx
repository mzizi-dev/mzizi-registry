"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Cloud, Globe, Shield, Zap } from "lucide-react"

const features = [
  { icon: Zap, label: "Lightning fast", description: "Built for speed across Africa" },
  { icon: Shield, label: "Secure by default", description: "Enterprise-grade encryption" },
  { icon: Globe, label: "Pan-African", description: "Multi-language, multi-currency" },
  { icon: Cloud, label: "Cloud native", description: "99.9% uptime guarantee" },
]

function Login05() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — brand showcase */}
      <div className="hidden flex-1 flex-col justify-between bg-card p-10 lg:flex">
        <div>
          <span className="font-serif text-xl font-semibold text-foreground">mukoko</span>
          <Badge variant="secondary" className="ml-2">ecosystem</Badge>
        </div>
        <div className="space-y-6">
          <h2 className="max-w-md font-serif text-3xl font-semibold leading-tight text-foreground">
            Technology built for Africa, by Africa.
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cobalt/10">
                  <f.icon className="size-4 text-cobalt" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-cobalt" />
          <span className="size-2 rounded-full bg-tanzanite" />
          <span className="size-2 rounded-full bg-malachite" />
          <span className="size-2 rounded-full bg-gold" />
          <span className="size-2 rounded-full bg-terracotta" />
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center border-l border-border px-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login05-email">Email</Label>
              <Input id="login05-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login05-password">Password</Label>
                <a href="#" className="text-xs text-cobalt hover:underline">Forgot?</a>
              </div>
              <Input id="login05-password" type="password" placeholder="Enter your password" />
            </div>
            <Button className="w-full">Sign in</Button>
          </div>
          <Separator />
          <p className="text-center text-sm text-muted-foreground">
            New to mukoko?{" "}
            <a href="#" className="font-medium text-foreground hover:underline">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export { Login05 }
