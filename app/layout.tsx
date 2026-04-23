import type { Metadata, Viewport } from "next"
import { Noto_Sans, Noto_Serif, JetBrains_Mono } from "next/font/google"
import { Footer, Layout, Navbar } from "nextra-theme-docs"
import { Head } from "nextra/components"
import { getPageMap } from "nextra/page-map"
import "nextra-theme-docs/style.css"
import "./globals.css"
import { NyuchiLogo } from "@/components/layout/nyuchi-logo"
import { MineralStrip } from "@/components/layout/mineral-strip"
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
    site: "@nyuchitech",
    creator: "@nyuchitech",
    title: "nyuchi — Design Portal",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
}

const navbar = (
  <Navbar
    // Full left-side brand lockup — icon + "nyuchi design" wordmark, both
    // clickable (Nextra auto-links the whole `logo` slot to `/`).
    logo={<NyuchiLogo size={24} showWordmark suffix="design" />}
    projectLink="https://github.com/nyuchitech/design-portal"
  />
)

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
