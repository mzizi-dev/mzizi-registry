"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

const steps = ["Account", "Profile", "Confirm"]

function Signup02() {
  const [step, setStep] = useState(0)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          {/* Progress */}
          <div className="mb-2 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    i < step
                      ? "bg-malachite/20 text-malachite"
                      : i === step
                        ? "bg-cobalt text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px flex-1 ${i < step ? "bg-malachite/40" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <CardTitle className="font-serif text-xl">{steps[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Set up your credentials"}
            {step === 1 && "Tell us about yourself"}
            {step === 2 && "Review and confirm your details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="signup02-email">Email</Label>
                <Input id="signup02-email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup02-password">Password</Label>
                <Input id="signup02-password" type="password" placeholder="Create a strong password" />
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup02-first">First name</Label>
                  <Input id="signup02-first" placeholder="Tanya" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup02-last">Last name</Label>
                  <Input id="signup02-last" placeholder="Moyo" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup02-org">Organization (optional)</Label>
                <Input id="signup02-org" placeholder="Nyuchi Africa" />
              </div>
            </>
          )}
          {step === 2 && (
            <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              <p>Review your information and click <span className="font-medium text-foreground">Create account</span> to finish.</p>
            </div>
          )}
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => (step < steps.length - 1 ? setStep(step + 1) : undefined)}
            >
              {step === steps.length - 1 ? "Create account" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { Signup02 }
