import type { Metadata, Viewport } from "next"
import { Noto_Sans, Noto_Serif, JetBrains_Mono } from "next/font/google"
import { Footer, Layout } from "nextra-theme-docs"
import { Head } from "nextra/components"
import { getPageMap } from "nextra/page-map"
import "nextra-theme-docs/style.css"
import "./globals.css"
import { MineralStrip } from "@/components/layout/mineral-strip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Header } from "@/components/landing/header"
import { Footer as CustomFooter } from "@/components/landing/footer"

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })
const fontSerif = Noto_Serif({ subsets: ["latin"], variable: "--font-serif" })
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const SITE_URL = "https://design.nyuchi.com"
const SITE_NAME = "Nyuchi Design Portal"
const SITE_DESCRIPTION =
  "The canonical design system for the bundu ecosystem — components, brand, MCP server, and AI-native developer tooling built on the Five African Minerals palette. Install directly into your project with the shadcn CLI."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "nyuchi — Design Portal",
    template: "%s | Nyuchi Design Portal",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Nyuchi Africa", url: "https://nyuchi.com" }],
  keywords: [
    "design system",
    "component library",
    "shadcn",
    "Africa",
    "React",
    "Next.js",
    "Tailwind CSS",
    "Five African Minerals",
    "mukoko",
    "nyuchi",
    "bundu",
    "UI components",
    "TypeScript",
  ],
  creator: "Nyuchi Africa (PVT) Ltd",
  publisher: "Nyuchi Africa (PVT) Ltd",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_ZW",
    alternateLocale: ["en_ZA", "en_GB", "en_US"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "nyuchi — Design Portal",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nyuchi Design Portal — Five African Minerals Design System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nyuchiafrica",
    creator: "@nyuchiafrica",
    title: "nyuchi — Design Portal",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
}

export const viewport: Viewport = {
  // Must match the semantic `--background` token in app/globals.css.
  // Updated April 2026 when L1 tokens swapped (see nyuchi-tokens registry).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F2EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1A17" },
  ],
}

// Custom header replaces Nextra's <Navbar>. Layout is identical at every
// breakpoint: logo + wordmark, 4 nav items (desktop only), 3-icon pill group
// (always visible). See `components/landing/header.tsx`.
const navbar = <Header />

const footer = (
  <Footer>
    <CustomFooter />
  </Footer>
)

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-ZW",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Nyuchi Africa (PVT) Ltd",
      url: "https://nyuchi.com",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/mukoko-icon-dark-cobalt.svg`,
      },
      sameAs: ["https://github.com/nyuchitech", "https://nyuchi.com", "https://mukoko.com"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description: SITE_DESCRIPTION,
      creator: { "@id": `${SITE_URL}/#organization` },
      softwareVersion: "4.0.26",
      downloadUrl: "https://design.nyuchi.com/api/v1/ui",
    },
  ],
}

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
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <body className="font-sans antialiased">
        {/* Mineral strip is a 4px fixed-position accent on the far left of
            every viewport. `pl-1` on the layout wrapper reserves 4px so
            content never overlaps it, and the strip sits at z-40 so the
            sticky header (z-50) naturally covers it — the strip appears
            only outside the header band. */}
        <MineralStrip className="fixed inset-y-0 left-0 z-40 h-screen rounded-none" />
        {/* SidebarProvider wraps the whole app so `NyuchiHeader`'s built-in
            SidebarTrigger has the context it needs. The actual `<Sidebar>`
            content lands in the follow-up dashboard-shell PR
            (`claude/nyuchi-dashboard-shell`); until then the trigger
            toggles an empty provider — harmless no-op on desktop, opens
            a stub sheet on mobile. `defaultOpen={false}` keeps the portal
            chrome-free for consumers still using Nextra's sidebar. */}
        <SidebarProvider defaultOpen={false}>
          <div className="w-full pl-1">
            <Layout
              navbar={navbar}
              pageMap={await getPageMap()}
              docsRepositoryBase="https://github.com/nyuchitech/design-portal/tree/main"
              footer={footer}
            >
              {children}
            </Layout>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
