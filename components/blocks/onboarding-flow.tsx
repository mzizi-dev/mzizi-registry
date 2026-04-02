"use client"

import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check, Sparkles, Upload } from "lucide-react"

const interests = [
  { label: "Farming", color: "bg-malachite/15 text-malachite border-malachite/30" },
  { label: "Mining", color: "bg-terracotta/15 text-terracotta border-terracotta/30" },
  { label: "Travel", color: "bg-cobalt/15 text-cobalt border-cobalt/30" },
  { label: "Tourism", color: "bg-tanzanite/15 text-tanzanite border-tanzanite/30" },
  { label: "Sports", color: "bg-gold/15 text-gold border-gold/30" },
  { label: "Technology", color: "bg-cobalt/15 text-cobalt border-cobalt/30" },
  { label: "Music", color: "bg-tanzanite/15 text-tanzanite border-tanzanite/30" },
  { label: "Food", color: "bg-malachite/15 text-malachite border-malachite/30" },
  { label: "Business", color: "bg-terracotta/15 text-terracotta border-terracotta/30" },
  { label: "Education", color: "bg-gold/15 text-gold border-gold/30" },
]

const steps = ["Welcome", "Profile", "Interests", "Complete"]

function OnboardingFlow() {
  const [step, setStep] = React.useState(0)
  const [selected, setSelected] = React.useState<string[]>([])

  const toggleInterest = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        {/* Progress indicator */}
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    i < step
                      ? "bg-malachite text-foreground"
                      : i === step
                        ? "bg-cobalt text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </div>
                <span className="text-[10px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-3 flex h-1 gap-1 overflow-hidden rounded-full">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-cobalt" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Welcome */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-1 w-32 overflow-hidden rounded-full">
                <div className="flex-1 bg-cobalt" />
                <div className="flex-1 bg-tanzanite" />
                <div className="flex-1 bg-malachite" />
                <div className="flex-1 bg-gold" />
                <div className="flex-1 bg-terracotta" />
              </div>
              <CardTitle className="font-serif text-2xl">Welcome to mukoko</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your gateway to the African digital ecosystem. Let us set up your experience in a few quick steps.
              </p>
            </div>
          )}

          {/* Step 2: Profile setup */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle className="font-serif text-lg">Set up your profile</CardTitle>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback>
                    <Upload className="size-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">Upload photo</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboard-name">Display name</Label>
                <Input id="onboard-name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboard-bio">Bio</Label>
                <Input id="onboard-bio" placeholder="Tell us about yourself" />
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle className="font-serif text-lg">Pick your interests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose topics you care about. This helps us personalize your feed.
              </p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <button
                    key={interest.label}
                    onClick={() => toggleInterest(interest.label)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                      selected.includes(interest.label)
                        ? interest.color
                        : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {selected.includes(interest.label) && <Check className="mr-1 inline size-3" />}
                    {interest.label}
                  </button>
                ))}
              </div>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/15">
                <Sparkles className="size-8 text-gold" />
              </div>
              <CardTitle className="font-serif text-2xl">You are all set!</CardTitle>
              <p className="text-sm text-muted-foreground">
                Welcome to the mukoko ecosystem. Start exploring and connecting with your community.
              </p>
              <div className="mx-auto flex h-1 w-32 overflow-hidden rounded-full">
                <div className="flex-1 bg-cobalt" />
                <div className="flex-1 bg-tanzanite" />
                <div className="flex-1 bg-malachite" />
                <div className="flex-1 bg-gold" />
                <div className="flex-1 bg-terracotta" />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between gap-2">
          {step > 0 && step < 3 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            {step < 3 && step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s + 1)}>
                Skip
              </Button>
            )}
            {step < 3 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                {step === 0 ? "Get started" : "Next"}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button size="sm">Go to dashboard</Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export { OnboardingFlow }
