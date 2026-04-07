"use client"

import * as React from "react"
import { Copy, Check, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"

function MfaSetup({
  qrCodeUrl,
  secret,
  onVerify,
  className,
  ...props
}: {
  qrCodeUrl: string
  secret: string
  onVerify: (code: string) => void
} & React.ComponentProps<"div">) {
  const [code, setCode] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)

  function handleCopySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleVerify() {
    if (code.length >= 6) {
      onVerify(code)
    }
  }

  return (
    <div data-slot="mfa-setup" className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-medium",
            step >= 1 ? "bg-[var(--color-cobalt)] text-white" : "bg-muted text-muted-foreground"
          )}
        >
          1
        </div>
        <div className="h-px flex-1 bg-border" />
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-medium",
            step >= 2 ? "bg-[var(--color-cobalt)] text-white" : "bg-muted text-muted-foreground"
          )}
        >
          2
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-sm font-medium text-foreground">Scan QR Code</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-white p-3">
            <img src={qrCodeUrl} alt="MFA QR Code" className="size-48" />
          </div>
          <div className="flex w-full flex-col gap-2">
            <span className="text-xs text-muted-foreground">Or enter this secret manually:</span>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
              <code className="flex-1 truncate font-mono text-xs">{secret}</code>
              <button
                type="button"
                onClick={handleCopySecret}
                className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Copy secret"
              >
                {copied ? (
                  <Check className="size-3.5 text-[var(--color-malachite)]" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="inline-flex h-9 items-center justify-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center gap-4">
          <ShieldCheck className="size-8 text-[var(--color-malachite)]" />
          <h3 className="text-sm font-medium text-foreground">Enter Verification Code</h3>
          <p className="text-center text-xs text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="h-12 w-40 rounded-xl border border-input bg-input/30 text-center font-mono text-xl tracking-[0.5em] transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={code.length < 6}
            className="inline-flex h-9 items-center justify-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      )}
    </div>
  )
}

export { MfaSetup }
