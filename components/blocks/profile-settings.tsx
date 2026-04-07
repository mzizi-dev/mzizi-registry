"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Bell, Shield, Palette, Lock, Upload } from "lucide-react"

const sections = [
  { id: "account", label: "Account", icon: User },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Lock },
]

function ProfileSettings() {
  const [active, setActive] = React.useState("account")

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActive(section.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active === section.id
                    ? "bg-cobalt/10 font-medium text-cobalt"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <section.icon className="size-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {active === "account" && (
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input id="settings-email" type="email" defaultValue="tendai@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-username">Username</Label>
                  <Input id="settings-username" defaultValue="tendai_m" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-language">Language</Label>
                  <Input id="settings-language" defaultValue="English" />
                </div>
              </CardContent>
            </Card>
          )}

          {active === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your public profile information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    <AvatarFallback>TM</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Upload className="size-4" />
                    Upload photo
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-first">First name</Label>
                    <Input id="settings-first" defaultValue="Tendai" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-last">Last name</Label>
                    <Input id="settings-last" defaultValue="Moyo" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-bio">Bio</Label>
                  <Textarea id="settings-bio" defaultValue="Building the future of African tech." />
                </div>
              </CardContent>
            </Card>
          )}

          {active === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose what you want to be notified about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    id: "notif-email",
                    label: "Email notifications",
                    desc: "Receive updates via email",
                  },
                  {
                    id: "notif-push",
                    label: "Push notifications",
                    desc: "Receive push notifications on your device",
                  },
                  {
                    id: "notif-mentions",
                    label: "Mentions",
                    desc: "Get notified when someone mentions you",
                  },
                  {
                    id: "notif-updates",
                    label: "Product updates",
                    desc: "News about mukoko features and releases",
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch id={item.id} defaultChecked={item.id !== "notif-updates"} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {active === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-current-pw">Current password</Label>
                  <Input
                    id="settings-current-pw"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-new-pw">New password</Label>
                  <Input id="settings-new-pw" type="password" placeholder="Enter new password" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch id="settings-mfa" />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-foreground">Active sessions</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Harare, Zimbabwe — Chrome on macOS — Current session
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {active === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how mukoko looks for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {["Light", "Dark", "System"].map((theme) => (
                    <button
                      key={theme}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-sm text-muted-foreground transition-colors hover:border-cobalt hover:text-foreground"
                    >
                      <div
                        className={`size-8 rounded-lg ${theme === "Light" ? "bg-background ring-1 ring-border" : theme === "Dark" ? "bg-foreground" : "bg-gradient-to-br from-background to-foreground"}`}
                      />
                      {theme}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {active === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Control who can see your information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    id: "priv-profile",
                    label: "Public profile",
                    desc: "Allow anyone to view your profile",
                  },
                  {
                    id: "priv-activity",
                    label: "Show activity status",
                    desc: "Let others see when you are online",
                  },
                  { id: "priv-search", label: "Searchable", desc: "Appear in search results" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch id={item.id} defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sticky save bar */}
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-background py-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ProfileSettings }
