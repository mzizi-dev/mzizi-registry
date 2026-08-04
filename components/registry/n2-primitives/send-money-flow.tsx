"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type FlowStep = "recipient" | "amount" | "confirm" | "receipt"

interface Recipient {
  id: string
  name: string
  avatar?: string
  phone?: string
}

interface SendMoneyFlowProps extends React.ComponentProps<"div"> {
  step?: FlowStep
  onStepChange?: (step: FlowStep) => void
  recentRecipients?: Recipient[]
  selectedRecipient?: Recipient
  onSelectRecipient?: (recipient: Recipient) => void
  amount?: number
  onAmountChange?: (amount: number) => void
  currency?: string
  fee?: number
  onConfirm?: () => void
  onCancel?: () => void
  transactionId?: string
}

function SendMoneyFlow({
  step = "recipient",
  onStepChange,
  recentRecipients = [],
  selectedRecipient,
  onSelectRecipient,
  amount = 0,
  onAmountChange,
  currency = "MXT",
  fee = 0,
  onConfirm,
  onCancel,
  transactionId,
  className,
  ...props
}: SendMoneyFlowProps) {
  return (
    <div
      data-slot="send-money-flow"
      data-portal="https://mzizi.dev/components/send-money-flow"
      role="form"
      aria-label="Send money"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card", className)}
      {...props}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 border-b border-border px-5 py-3">
        {(["recipient", "amount", "confirm", "receipt"] as FlowStep[]).map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                step === s
                  ? "bg-primary text-primary-foreground"
                  : ["recipient", "amount", "confirm", "receipt"].indexOf(step) > i
                    ? "bg-[var(--color-malachite,#64FFDA)]/20 text-[var(--color-malachite,#64FFDA)]"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            {i < 3 && <div className="h-px flex-1 bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <div className="p-5">
        {/* Step 1: Recipient */}
        {step === "recipient" && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Send to</div>
            <input
              type="text"
              placeholder="Search name or enter phone number…"
              className="h-12 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            />
            {recentRecipients.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10px] font-medium text-muted-foreground">Recent</div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recentRecipients.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectRecipient?.(r)
                        onStepChange?.("amount")
                      }}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {r.avatar ? (
                          <img
                            src={r.avatar}
                            alt=""
                            className="size-full rounded-full object-cover"
                          />
                        ) : (
                          r.name.charAt(0)
                        )}
                      </div>
                      <span className="w-14 truncate text-[10px]">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Amount */}
        {step === "amount" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-xs text-muted-foreground">
              Sending to{" "}
              <span className="font-medium text-foreground">{selectedRecipient?.name}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-muted-foreground">{currency}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount || ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
                  if (!isNaN(v)) onAmountChange?.(v)
                }}
                placeholder="0.00"
                className="w-48 bg-transparent text-center text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/30"
                autoFocus
              />
            </div>
            {fee > 0 && (
              <div className="text-xs text-muted-foreground">
                Fee: {fee.toFixed(2)} {currency}
              </div>
            )}
            <button
              onClick={() => onStepChange?.("confirm")}
              disabled={!amount || amount <= 0}
              className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">You are sending</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">
                {amount?.toLocaleString()} {currency}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">to {selectedRecipient?.name}</div>
              {fee > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Fee: {fee.toFixed(2)} {currency} · Total: {((amount || 0) + fee).toFixed(2)}{" "}
                  {currency}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="h-12 flex-1 rounded-full border border-border text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm?.()
                  onStepChange?.("receipt")
                }}
                className="h-12 flex-1 rounded-full bg-primary text-sm font-medium text-primary-foreground"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Receipt */}
        {step === "receipt" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-malachite,#64FFDA)]/15 text-xl">
              ✓
            </div>
            <div
              className="text-base font-semibold"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              Money Sent
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {amount?.toLocaleString()} {currency}
            </div>
            <div className="text-sm text-muted-foreground">to {selectedRecipient?.name}</div>
            {transactionId && (
              <div className="font-mono text-[9px] text-muted-foreground">TX: {transactionId}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { SendMoneyFlow }
export type { SendMoneyFlowProps }
