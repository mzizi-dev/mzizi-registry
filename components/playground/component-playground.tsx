"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Check, Terminal } from "lucide-react"

export function ButtonPlayground() {
  const [variant, setVariant] = useState<string>("default")
  const [size, setSize] = useState<string>("default")

  const variants = [
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
  ]
  const sizes = ["default", "sm", "lg", "icon"]

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Button</p>
      </div>
      <div className="p-6">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Variant
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    variant === v
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Size</p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    size === s
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Button variant={variant as any} size={size as any}>
            {size === "icon" ? <Check className="size-4" /> : "Button"}
          </Button>
        </div>

        <div className="mt-4 rounded-lg bg-muted p-4">
          <code className="text-sm text-foreground">
            {`<Button${variant !== "default" ? ` variant="${variant}"` : ""}${size !== "default" ? ` size="${size}"` : ""}>${size === "icon" ? "<Check />" : "Button"}</Button>`}
          </code>
        </div>
      </div>
    </div>
  )
}

export function BadgePlayground() {
  const [variant, setVariant] = useState<string>("default")
  const variants = ["default", "secondary", "destructive", "outline"]

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Badge</p>
      </div>
      <div className="p-6">
        <div className="mb-6 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Variant</p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  variant === v
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Badge variant={variant as any}>Badge</Badge>
        </div>
        <div className="mt-4 rounded-lg bg-muted p-4">
          <code className="text-sm text-foreground">
            {`<Badge${variant !== "default" ? ` variant="${variant}"` : ""}>Badge</Badge>`}
          </code>
        </div>
      </div>
    </div>
  )
}

export function CardPlayground() {
  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Card</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>
                Deploy your new project in one-click.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Name of your project" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Deploy</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function InputPlayground() {
  const [disabled, setDisabled] = useState(false)
  const [type, setType] = useState("text")
  const types = ["text", "email", "password", "number", "search"]

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Input</p>
      </div>
      <div className="p-6">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    type === t
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="disabled-input"
                checked={disabled}
                onCheckedChange={(checked) => setDisabled(checked === true)}
              />
              <label
                htmlFor="disabled-input"
                className="text-xs text-muted-foreground"
              >
                Disabled
              </label>
            </div>
          </div>
        </div>
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Input
            type={type}
            placeholder={`Enter ${type}...`}
            disabled={disabled}
            className="max-w-sm"
          />
        </div>
        <div className="mt-4 rounded-lg bg-muted p-4">
          <code className="text-sm text-foreground">
            {`<Input type="${type}"${disabled ? " disabled" : ""} placeholder="Enter ${type}..." />`}
          </code>
        </div>
      </div>
    </div>
  )
}

export function AlertPlayground() {
  const [variant, setVariant] = useState<string>("default")
  const variants = ["default", "destructive"]

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Alert</p>
      </div>
      <div className="p-6">
        <div className="mb-6 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Variant</p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  variant === v
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Alert variant={variant as any} className="max-w-md">
            {variant === "destructive" ? (
              <AlertCircle className="size-4" />
            ) : (
              <Terminal className="size-4" />
            )}
            <AlertTitle>
              {variant === "destructive" ? "Error" : "Heads up!"}
            </AlertTitle>
            <AlertDescription>
              {variant === "destructive"
                ? "Your session has expired. Please log in again."
                : "You can add components to your app using the CLI."}
            </AlertDescription>
          </Alert>
        </div>
        <div className="mt-4 rounded-lg bg-muted p-4">
          <code className="text-sm text-foreground">
            {`<Alert${variant !== "default" ? ` variant="${variant}"` : ""}>\n  <AlertTitle>${variant === "destructive" ? "Error" : "Heads up!"}</AlertTitle>\n  <AlertDescription>...</AlertDescription>\n</Alert>`}
          </code>
        </div>
      </div>
    </div>
  )
}

export function SwitchPlayground() {
  const [checked, setChecked] = useState(false)
  const [disabled, setDisabled] = useState(false)

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Switch</p>
      </div>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="disabled-switch"
              checked={disabled}
              onCheckedChange={(checked) => setDisabled(checked === true)}
            />
            <label
              htmlFor="disabled-switch"
              className="text-xs text-muted-foreground"
            >
              Disabled
            </label>
          </div>
        </div>
        <div className="flex min-h-[80px] items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background p-8">
          <Switch
            id="demo-switch"
            checked={checked}
            onCheckedChange={setChecked}
            disabled={disabled}
          />
          <Label htmlFor="demo-switch">{checked ? "On" : "Off"}</Label>
        </div>
        <div className="mt-4 rounded-lg bg-muted p-4">
          <code className="text-sm text-foreground">
            {`<Switch${checked ? " checked" : ""}${disabled ? " disabled" : ""} />`}
          </code>
        </div>
      </div>
    </div>
  )
}

export function TabsPlayground() {
  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Tabs</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Make changes to your account here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="tab-name">Name</Label>
                    <Input id="tab-name" defaultValue="Mukoko" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save password</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export function SelectPlayground() {
  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium">Select</p>
      </div>
      <div className="p-6">
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border bg-background p-8">
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a mineral" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cobalt">Cobalt</SelectItem>
              <SelectItem value="tanzanite">Tanzanite</SelectItem>
              <SelectItem value="malachite">Malachite</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="terracotta">Terracotta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
