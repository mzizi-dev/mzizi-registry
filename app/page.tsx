import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { InstallSteps } from "@/components/landing/install-steps"
import { ComponentShowcase } from "@/components/landing/component-showcase"
import { ComponentCatalog } from "@/components/landing/component-catalog"
import { Footer } from "@/components/landing/footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <InstallSteps />
        <ComponentShowcase />
        <ComponentCatalog />
      </main>
      <Footer />
    </div>
  )
}
