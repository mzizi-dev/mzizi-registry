import type { Metadata, Viewport } from "next"
import { Noto_Sans, Noto_Serif, JetBrains_Mono } from "next/font/google"
import { Footer, Layout, Navbar } from "nextra-theme-docs"
import { Head } from "nextra/components"
import { getPageMap } from "nextra/page-map"
import "nextra-theme-docs/style.css"
import "./globals.css"
import { MukokoLogo } from "@/components/brand/mukoko-logo"

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })
const fontSerif = Noto_Serif({ subsets: ["latin"], variable: "--font-serif" })
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "mukoko — Component Registry",
  description:
    "A curated collection of production-ready UI components built on the Five African Minerals design system. Install directly into your project with the shadcn CLI.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
}

const navbar = (
  <Navbar
    logo={<MukokoLogo size={24} suffix="registry" />}
    projectLink="https://github.com/nyuchitech/mukoko-registry"
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
        v7.0.0
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
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/nyuchitech/mukoko-registry/tree/main"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
