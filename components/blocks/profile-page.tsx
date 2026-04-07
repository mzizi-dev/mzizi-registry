"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Share2, MessageCircle, UserPlus, Calendar } from "lucide-react"

const stats = [
  { label: "Followers", value: "2,847", color: "text-cobalt" },
  { label: "Following", value: "382", color: "text-tanzanite" },
  { label: "Posts", value: "1,204", color: "text-malachite" },
]

const posts = [
  { title: "Exploring Matobo Hills this weekend", date: "2d ago", likes: 48, category: "Travel" },
  {
    title: "Best maize varieties for this season",
    date: "5d ago",
    likes: 132,
    category: "Farming",
  },
  { title: "Recap: Harare marathon experience", date: "1w ago", likes: 96, category: "Sports" },
]

function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl">
        {/* Cover image area */}
        <div className="relative h-48 rounded-b-2xl bg-muted sm:h-56">
          {/* Mineral accent stripe on left edge */}
          <div className="absolute top-0 left-0 flex h-full w-1 flex-col overflow-hidden rounded-bl-2xl">
            <div className="flex-1 bg-cobalt" />
            <div className="flex-1 bg-tanzanite" />
            <div className="flex-1 bg-malachite" />
            <div className="flex-1 bg-gold" />
            <div className="flex-1 bg-terracotta" />
          </div>
        </div>

        {/* Profile header */}
        <div className="relative px-4 sm:px-6">
          <div className="-mt-12 flex flex-col sm:-mt-16 sm:flex-row sm:items-end sm:gap-5">
            <Avatar className="size-24 ring-4 ring-background sm:size-24">
              <AvatarImage src="/avatars/01.png" alt="Tendai Moyo" />
              <AvatarFallback className="text-xl">TM</AvatarFallback>
            </Avatar>
            <div className="mt-3 flex flex-1 flex-col gap-3 sm:mt-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-foreground">Tendai Moyo</h1>
                <p className="text-sm text-muted-foreground">@tendai_m</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm">
                  <UserPlus className="size-4" />
                  Follow
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="size-4" />
                  Message
                </Button>
                <Button variant="ghost" size="icon-sm">
                  <Share2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-4 text-sm text-foreground">
            Building the future of African tech, one line at a time. Community advocate and
            open-source enthusiast based in Harare.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              Harare, Zimbabwe
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              Joined March 2024
            </span>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <Separator className="mt-4" />
        </div>

        {/* Tabs */}
        <div className="px-4 pt-2 sm:px-6">
          <Tabs defaultValue="posts">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-4 space-y-3">
              {posts.map((post) => (
                <Card key={post.title} size="sm">
                  <CardContent className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{post.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        <span className="text-xs text-muted-foreground">{post.date}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{post.likes} likes</span>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="about" className="mt-4">
              <Card size="sm">
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Software engineer passionate about building technology that serves African
                    communities. Contributor to mukoko and several open-source projects.
                  </p>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Flutter</Badge>
                    <Badge variant="outline">Open Source</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <Card size="sm">
                <CardContent className="text-sm text-muted-foreground">
                  <p>Recent activity will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export { ProfilePage }
