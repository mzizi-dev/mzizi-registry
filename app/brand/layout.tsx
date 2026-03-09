import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14">{children}</main>
      <Footer />
    </div>
  )
}
