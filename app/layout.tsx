import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Serif, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const fontSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });
const fontSerif = Noto_Serif({ subsets: ["latin"], variable: "--font-serif" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "mukoko -- Component Registry",
  description:
    "A curated collection of production-ready UI components built on the Five African Minerals design system. Install directly into your project with the shadcn CLI.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
