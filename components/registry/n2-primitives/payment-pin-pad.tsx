"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PaymentPinPadProps extends React.ComponentProps<"div"> {
  /** PIN length */
  length?: number
  /** Called when complete PIN is entered */
  onComplete?: (pin: string) => void
  /** Called to dismiss */
  onCancel?: () => void
  /** Error message to display */
  error?: string
  /** Show biometric option */
  showBiometric?: boolean
  /** Called when biometric is chosen */
  onBiometric?: () => void
  /** Title above the pad */
  title?: string
}

function PaymentPinPad({
  length = 4,
  onComplete,
  onCancel,
  error,
  showBiometric = false,
  onBiometric,
  title = "Enter your PIN",
  className,
  ...props
}: PaymentPinPadProps) {
  const [pin, setPin] = React.useState("")
  const [shaking, setShaking] = React.useState(false)

  React.useEffect(() => {
    if (error) {
      setShaking(true)
      setPin("")
      const t = setTimeout(() => setShaking(false), 500)
      return () => clearTimeout(t)
    }
  }, [error])

  const handleDigit = (digit: string) => {
    if (pin.length >= length) return
    const next = pin + digit
    setPin(next)
    if (next.length === length) {
      /* Small delay so the last dot fills visually before callback fires */
      setTimeout(() => onComplete?.(next), 150)
    }
  }

  const handleBackspace = () => setPin((p) => p.slice(0, -1))

  return (
    <div
      data-slot="payment-pin-pad"
      data-portal="https://mzizi.dev/components/payment-pin-pad"
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-xl,17px)] bg-card p-6",
        className
      )}
      {...props}
    >
      {/* Title */}
      <div className="text-sm font-medium">{title}</div>

      {/* PIN dots */}
      <div className={cn("mt-6 flex gap-3", shaking && "animate-[shake_0.3s_ease-in-out]")}>
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 transition-colors",
              i < pin.length
                ? "border-primary bg-primary"
                : "border-muted-foreground/30 bg-transparent"
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && <div className="mt-2 text-xs text-destructive">{error}</div>}

      {/* Number pad */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-medium transition-colors hover:bg-border active:bg-primary active:text-primary-foreground"
          >
            {d}
          </button>
        ))}

        {/* Bottom row: biometric / 0 / backspace */}
        <div className="flex items-center justify-center">
          {showBiometric && onBiometric ? (
            <button
              onClick={onBiometric}
              className="flex size-16 items-center justify-center rounded-full bg-muted text-lg hover:bg-border"
              aria-label="Use biometric"
            >
              👆
            </button>
          ) : null}
        </div>
        <button
          onClick={() => handleDigit("0")}
          className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-medium hover:bg-border active:bg-primary active:text-primary-foreground"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={pin.length === 0}
          className="flex size-16 items-center justify-center rounded-full text-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>

      {/* Cancel */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

export { PaymentPinPad }
export type { PaymentPinPadProps }
