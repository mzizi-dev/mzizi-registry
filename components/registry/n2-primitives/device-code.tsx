"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  DEVICE_CODE_CLASSES as C,
  DEVICE_CODE_TEXT as T,
  displayUri,
  effectiveStatus,
  formatRemaining,
  formatUserCode,
  spokenUserCode,
  statusMessage,
  timeMs,
  type DeviceCodeSize,
  type DeviceCodeStatus,
  type DeviceCodeTime,
} from "@/lib/device-code-format"
import { qrMatrix, qrPath, qrViewBox } from "@/lib/qr-code"

/*
 * DEVICE CODE — N2 primitive. The device side of OAuth 2.0 Device Authorization
 * (RFC 8628 §3.3): the user code (large, monospace, read across a room), the short
 * verification address, a QR code of the complete address drawn on the device (`qr-code`,
 * never a network service), a countdown, and a status line that is a polite live region.
 *
 * One contract for every build: `contracts/ui/device-code.contract.json`. `device-code.astro`
 * (the default web build) and `device-code.rs` (Mzizi Roots) render the same markup with the
 * same classes. This build ticks the countdown itself once mounted and turns a lapsed code
 * into `expired`; `onRefresh` is the refresh button's handler, and `refreshHref` makes it a
 * link instead.
 */

export type { DeviceCodeSize, DeviceCodeStatus, DeviceCodeTime }

export interface DeviceCodeProps {
  /** RFC 8628 `user_code`. Shown upper case in groups of four (`KTQB-4RMX`). */
  userCode: string
  /** RFC 8628 `verification_uri`: the short address a person types. */
  verificationUri: string
  /** RFC 8628 `verification_uri_complete`: the address with the code, drawn as the QR code. */
  verificationUriComplete: string
  /** When the code lapses (ISO 8601, Unix ms or a Date). */
  expiresAt: DeviceCodeTime
  /** Where the pairing stands; a `pending` code past `expiresAt` shows as `expired`. */
  status?: DeviceCodeStatus
  /** `phone` (default) or `tv`, for a screen read from across a room. */
  size?: DeviceCodeSize
  /** The clock for the first render (server rendering, tests); the live clock after mount. */
  now?: DeviceCodeTime
  /** Makes the refresh control a link to this address. */
  refreshHref?: string
  /** Called when the person asks for a new code. */
  onRefresh?: () => void
  className?: string
}

export function DeviceCode({
  userCode,
  verificationUri,
  verificationUriComplete,
  expiresAt,
  status = "pending",
  size = "phone",
  now,
  refreshHref,
  onRefresh,
  className,
}: DeviceCodeProps) {
  const [clock, setClock] = React.useState(() => (now === undefined ? Date.now() : timeMs(now)))
  const expiresMs = timeMs(expiresAt)
  const remaining = expiresMs - clock
  const shown = effectiveStatus(status, remaining)

  React.useEffect(() => {
    if (shown !== "pending") return
    const tick = () => setClock(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [shown])

  const qr = React.useMemo(
    () => (shown === "pending" ? qrMatrix(verificationUriComplete, "M") : null),
    [shown, verificationUriComplete]
  )

  return (
    <div
      data-slot="device-code"
      data-portal="https://mzizi.dev/components/device-code"
      data-status={shown}
      data-size={size}
      data-expires-at={Number.isFinite(expiresMs) ? String(expiresMs) : undefined}
      role="group"
      aria-label={T.label}
      className={cn(C.root, C.rootSize[size], className)}
    >
      {shown === "pending" && (
        <div data-slot="device-code-pending" className={C.pending[size]}>
          <div className={C.steps}>
            <p className={C.step[size]}>{T.goTo}</p>
            <p data-slot="device-code-uri" className={C.uri[size]}>
              {displayUri(verificationUri)}
            </p>
            <p className={C.step[size]}>{T.enter}</p>
            <p data-slot="device-code-user-code" aria-hidden="true" className={C.code[size]}>
              {formatUserCode(userCode)}
            </p>
            <p data-slot="device-code-spoken" className="sr-only">
              {T.spokenPrefix + spokenUserCode(userCode)}
            </p>
            {Number.isFinite(expiresMs) && (
              <p data-slot="device-code-countdown" className={C.countdown[size]}>
                {T.expiresIn}
                <span data-slot="device-code-timer" role="timer" className={C.timer} suppressHydrationWarning>
                  {formatRemaining(remaining)}
                </span>
              </p>
            )}
          </div>
          {qr && (
            <figure className={C.figure}>
              <svg
                data-slot="device-code-qr"
                role="img"
                aria-label={`QR code for ${verificationUriComplete}`}
                viewBox={qrViewBox(qr.size)}
                shapeRendering="crispEdges"
                className={C.qr[size]}
              >
                <path fill="currentColor" d={qrPath(qr)} />
              </svg>
              <figcaption className={C.caption[size]}>{T.scan}</figcaption>
            </figure>
          )}
        </div>
      )}
      <p data-slot="device-code-status" role="status" className={C.status[size]}>
        <span aria-hidden="true" className={C.dot[size]} />
        <span data-slot="device-code-message" suppressHydrationWarning>
          {statusMessage(shown, remaining)}
        </span>
      </p>
      {shown !== "approved" && (
        <div data-slot="device-code-ended" hidden={shown === "pending"} className={C.ended}>
          {refreshHref ? (
            <a href={refreshHref} data-device-code-refresh="" onClick={onRefresh} className={C.refresh[size]}>
              {T.refresh}
            </a>
          ) : (
            <button type="button" data-device-code-refresh="" onClick={onRefresh} className={C.refresh[size]}>
              {T.refresh}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
