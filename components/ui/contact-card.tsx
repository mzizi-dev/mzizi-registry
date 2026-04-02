import * as React from "react"
import { MailIcon, PhoneIcon, MapPinIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactCardProps {
  name: string
  email?: string
  phone?: string
  address?: string
  avatar?: string
  role?: string
  className?: string
}

function ContactCard({
  name,
  email,
  phone,
  address,
  avatar,
  role,
  className,
}: ContactCardProps) {
  return (
    <div
      data-slot="contact-card"
      className={cn(
        "ring-foreground/10 bg-card text-card-foreground flex flex-col gap-4 rounded-2xl p-6 text-sm ring-1",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-base font-medium">{name}</span>
          {role && (
            <span className="text-xs text-muted-foreground">{role}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <MailIcon className="size-4 shrink-0" />
            {email}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <PhoneIcon className="size-4 shrink-0" />
            {phone}
          </a>
        )}
        {address && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="size-4 shrink-0" />
            {address}
          </span>
        )}
      </div>
    </div>
  )
}

export { ContactCard }
export type { ContactCardProps }
