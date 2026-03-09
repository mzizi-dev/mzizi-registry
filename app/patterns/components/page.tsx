import { CodeBlock } from "@/components/patterns/code-block"
import { ComponentPatternDemo } from "@/components/patterns/component-pattern-demo"

export default function ComponentPatternsPage() {
  return (
    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <a
            href="/patterns"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Patterns
          </a>
          <span className="mx-2 text-muted-foreground">/</span>
        </div>

        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Component Patterns
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every component in the registry follows these mandatory patterns:
            CVA for variants, Radix UI for accessibility, cn() for class
            composition, and data attributes for CSS targeting.
          </p>
        </div>

        {/* The 4 pillars */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "CVA Variants",
              mineral: "cobalt",
              description:
                "class-variance-authority defines type-safe variant maps. Every visual variant is declarative, composable, and has defaults.",
            },
            {
              title: "Radix + Slot",
              mineral: "tanzanite",
              description:
                "Radix UI primitives handle focus management, keyboard navigation, and screen reader behavior. Slot enables polymorphic rendering via asChild.",
            },
            {
              title: "cn() Composition",
              mineral: "malachite",
              description:
                "clsx + tailwind-merge. Handles conditional classes and resolves Tailwind conflicts. Never use string concatenation for classNames.",
            },
            {
              title: "data-slot Attributes",
              mineral: "gold",
              description:
                "Every component gets data-slot, data-variant, and data-size attributes for CSS targeting without fragile class selectors.",
            },
          ].map((item) => {
            const colors: Record<string, string> = {
              cobalt: "bg-[var(--color-cobalt)]",
              tanzanite: "bg-[var(--color-tanzanite)]",
              malachite: "bg-[var(--color-malachite)]",
              gold: "bg-[var(--color-gold)]",
            }
            return (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 rounded-full ${colors[item.mineral]}`}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Live demo */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Interactive demo showing how CVA variants, cn() composition, and
            data attributes work together. Toggle variants and inspect the
            rendered output.
          </p>
          <ComponentPatternDemo />
        </div>

        {/* Full anatomy */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Full component anatomy
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            This is the complete pattern every registry component follows.
            Use this as your template when adding new components.
          </p>
          <CodeBlock
            filename="components/ui/example-component.tsx"
            code={`"use client"

import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "radix-ui/internal/slot"
import { cn } from "@/lib/utils"

// 1. Define variants with CVA
const exampleVariants = cva(
  // Base classes — always applied
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border border-border bg-input/30 hover:bg-input/50",
        ghost: "hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-9 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 2. Define props — extend CVA variants + HTML attributes
interface ExampleProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof exampleVariants> {
  asChild?: boolean  // Enable polymorphic rendering
}

// 3. Named export (never default export)
export function Example({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ExampleProps) {
  // 4. Slot for polymorphic rendering
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      // 5. data attributes for CSS targeting
      data-slot="example"
      data-variant={variant}
      data-size={size}
      // 6. cn() for class composition — never string concat
      className={cn(exampleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// 7. Export variants for external use
export { exampleVariants }`}
          />
        </div>

        {/* CVA deep dive */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            CVA variant system
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            class-variance-authority provides type-safe variant maps. Variants
            are composable — combine any variant + size combination. Default
            variants are applied automatically.
          </p>
          <CodeBlock
            filename="variant usage"
            code={`// Type-safe — TypeScript catches invalid variants
<Button variant="default" size="sm" />
<Button variant="outline" size="lg" />
<Button variant="ghost" />  // uses defaultVariants.size

// Use buttonVariants() for non-Button elements
<a className={cn(buttonVariants({ variant: "link" }))}>
  Click here
</a>

// Extend with className — cn() resolves conflicts
<Button className="rounded-full bg-[var(--color-cobalt)]">
  Custom
</Button>`}
          />
        </div>

        {/* cn() */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            cn() composition
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              cn()
            </code>{" "}
            is clsx + tailwind-merge. It handles conditional classes and
            resolves Tailwind conflicts (e.g., if both{" "}
            <code className="rounded bg-secondary px-1 font-mono text-xs">
              px-4
            </code>{" "}
            and{" "}
            <code className="rounded bg-secondary px-1 font-mono text-xs">
              px-2
            </code>{" "}
            are applied, the last one wins).
          </p>
          <CodeBlock
            filename="lib/utils.ts"
            code={`import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage examples:
cn("px-4 py-2", "px-2")
// → "py-2 px-2" (px-4 removed, px-2 wins)

cn("text-red-500", isActive && "text-blue-500")
// → "text-blue-500" when isActive is true

cn(buttonVariants({ variant: "outline" }), className)
// → merges CVA output with custom className`}
          />
        </div>

        {/* Radix + Slot */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Radix UI + Slot polymorphism
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              asChild
            </code>{" "}
            prop with Radix Slot lets you render any element while keeping the
            component&apos;s styles and behavior. This is how a Button can be
            rendered as a link.
          </p>
          <CodeBlock
            filename="polymorphic rendering"
            code={`// Renders as <button>
<Button>Click me</Button>

// Renders as <a> with Button styles
<Button asChild>
  <a href="/dashboard">Go to dashboard</a>
</Button>

// Renders as Next.js Link with Button styles
<Button asChild>
  <Link href="/patterns">View patterns</Link>
</Button>

// How it works internally:
function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp {...props} />
  // Slot.Root renders the child element with merged props
}`}
          />
        </div>

        {/* data attributes */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Data attributes
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Every component includes data attributes for stable CSS targeting.
            These are more reliable than class selectors which can change.
          </p>
          <CodeBlock
            filename="data attribute usage"
            code={`// Components output these attributes:
<button
  data-slot="button"
  data-variant="outline"
  data-size="sm"
>

// Target in CSS (globals.css or Tailwind)
[data-slot="button"] { ... }
[data-slot="button"][data-variant="destructive"] { ... }

// Target in Tailwind with has-data-* modifier
<div className="has-data-[slot=button]:p-4">
  <Button>Inside a container</Button>
</div>

// Useful for parent-based styling
.form-field [data-slot="label"] {
  font-weight: 600;
}`}
          />
        </div>

        {/* Checklist */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Component checklist
          </h3>
          <ul className="flex flex-col gap-3">
            {[
              "CVA for all visual variants — never inline conditional classes",
              "cn() for all className composition — never string concatenation",
              "Radix UI primitives for accessibility (focus, keyboard, screen reader)",
              "data-slot attribute on the root element",
              "data-variant and data-size attributes when applicable",
              "Named exports only — no default exports",
              "\"use client\" only when using hooks, event handlers, or browser APIs",
              "All colors from CSS custom properties — no hardcoded hex",
              "Entry in registry.json with dependencies and files",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-malachite)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
