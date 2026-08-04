"use client"

import { AspectRatio as AspectRatioPrimitive } from "radix-ui"

function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return (
    <AspectRatioPrimitive.Root
      data-slot="aspect-ratio"
      data-portal="https://mzizi.dev/components/aspect-ratio"
      {...props}
    />
  )
}

export { AspectRatio }
