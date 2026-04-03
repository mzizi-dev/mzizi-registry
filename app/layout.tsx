import type { Metadata, Viewport } from "next"
import { Noto_Sans, Noto_Serif, JetBrains_Mono } from "next/font/google"
import { Footer, Layout, Navbar } from "nextra-theme-docs"
import { Head } from "nextra/components"
import { getPageMap } from "nextra/page-map"
import "nextra-theme-docs/style.css"
import "./globals.css"
import { MukokoLogo } from "@/components/brand/mukoko-logo"
import { MineralStrip } from "@/components/brand/mineral-strip"

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })
const fontSerif = Noto_Serif({ subsets: ["latin"], variable: "--font-serif" })
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "nyuchi — Design Portal",
  description:
    "294 production-ready UI components, blocks, and charts built on the Five African Minerals design system. The design system for the nyuchi ecosystem. Install directly into your project with the shadcn CLI.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
}

const navbar = (
  <Navbar
    logo={<MukokoLogo size={24} suffix="design" />}
    projectLink="https://github.com/nyuchitech/design-portal"
  />
)

const footer = (
  <Footer>
    <div className="flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
      <span className="text-xs text-muted-foreground">
        Built by{" "}
        <a
          href="https://github.com/nyuchitech"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Nyuchi Africa
        </a>
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        v4.0.1
      </span>
    </div>
  </Footer>
)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <Head />
      <body className="font-sans antialiased">
        <MineralStrip className="fixed inset-y-0 left-0 z-50 h-screen rounded-none" />
        <div className="pl-1">
          <Layout
            navbar={navbar}
            pageMap={await getPageMap()}
            docsRepositoryBase="https://github.com/nyuchitech/design-portal/tree/main"
            footer={footer}
          >
            {children}
          </Layout>
        </div>
      </body>
    </html>
  )
}
