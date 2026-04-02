"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

import { Copy, Check } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"

function PreviewCard({
  name,
  description,
  children,
}: {
  name: string
  description: string
  children: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const installCmd = `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${name}`

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-foreground/12">
      <div className="flex min-h-[180px] items-center justify-center p-4 sm:min-h-[200px] sm:p-8">
        <ErrorBoundary
          fallback={
            <p className="text-xs text-muted-foreground">
              Preview unavailable
            </p>
          }
        >
          {children}
        </ErrorBoundary>
      </div>
      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-medium text-foreground">{name}</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(installCmd)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`Copy install command for ${name}`}
          >
            {copied ? (
              <Check className="size-3.5 text-[var(--color-malachite)]" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function ButtonShowcase() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}

function BadgeShowcase() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Error</Badge>
    </div>
  )
}

function CardShowcase() {
  return (
    <Card className="w-full max-w-[280px]" size="sm">
      <CardHeader>
        <CardTitle>Project Shamwari</CardTitle>
        <CardDescription>AI companion deployment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="border-[var(--color-malachite)]/30 text-[var(--color-malachite)]">
              Active
            </Badge>
          </div>
          <Progress value={72} />
          <span className="text-xs text-muted-foreground">72% deployed</span>
        </div>
      </CardContent>
    </Card>
  )
}

function InputShowcase() {
  return (
    <div className="flex w-full max-w-[260px] flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-demo" className="text-sm">
          Email
        </Label>
        <Input id="email-demo" type="email" placeholder="you@mukoko.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="search-demo" className="text-sm">
          Search
        </Label>
        <Input id="search-demo" type="search" placeholder="Search components..." />
      </div>
    </div>
  )
}

function SwitchShowcase() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Switch id="notifications" defaultChecked />
        <Label htmlFor="notifications" className="text-sm">
          Notifications
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="dark-mode" />
        <Label htmlFor="dark-mode" className="text-sm">
          Dark mode
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="agree" defaultChecked />
        <Label htmlFor="agree" className="text-sm">
          Accept terms
        </Label>
      </div>
    </div>
  )
}

function TabsShowcase() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-[300px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-3">
        <div className="flex flex-col gap-2 rounded-xl bg-secondary p-3">
          <p className="text-sm font-medium text-foreground">Dashboard</p>
          <p className="text-xs text-muted-foreground">Project overview and key metrics.</p>
        </div>
      </TabsContent>
      <TabsContent value="analytics" className="mt-3">
        <div className="flex flex-col gap-2 rounded-xl bg-secondary p-3">
          <p className="text-sm font-medium text-foreground">Analytics</p>
          <p className="text-xs text-muted-foreground">Performance and engagement data.</p>
        </div>
      </TabsContent>
      <TabsContent value="settings" className="mt-3">
        <div className="flex flex-col gap-2 rounded-xl bg-secondary p-3">
          <p className="text-sm font-medium text-foreground">Settings</p>
          <p className="text-xs text-muted-foreground">Project configuration.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function AvatarShowcase() {
  return (
    <div className="flex flex-col items-center gap-4">
      <AvatarGroup>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>CD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>EF</AvatarFallback>
        </Avatar>
      </AvatarGroup>
      <Separator className="w-24" />
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}


export function ComponentShowcase() {
  return (
    <section id="components" className="px-4 py-16 sm:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Live Preview
          </p>
          <h2 className="font-serif text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            See them in action
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Interactive previews of components from the registry. Click the copy icon to grab the install command.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <PreviewCard
            name="button"
            description="Versatile button component with multiple variants and sizes."
          >
            <ButtonShowcase />
          </PreviewCard>
          <PreviewCard
            name="badge"
            description="Small status indicators and labels."
          >
            <BadgeShowcase />
          </PreviewCard>
          <PreviewCard
            name="card"
            description="Container with header, content, and footer sections."
          >
            <CardShowcase />
          </PreviewCard>
          <PreviewCard
            name="input"
            description="Form input fields with label support."
          >
            <InputShowcase />
          </PreviewCard>
          <PreviewCard
            name="switch"
            description="Toggle controls for binary states."
          >
            <SwitchShowcase />
          </PreviewCard>
          <PreviewCard
            name="tabs"
            description="Layered content sections with tab navigation."
          >
            <TabsShowcase />
          </PreviewCard>
          <PreviewCard
            name="avatar"
            description="User representation with image fallbacks and grouping."
          >
            <AvatarShowcase />
          </PreviewCard>

        </div>
      </div>
    </section>
  )
}
