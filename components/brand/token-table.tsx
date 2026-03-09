"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TokenRow {
  name: string
  value: string
  preview?: string
  description?: string
}

interface TokenTableProps {
  tokens: TokenRow[]
  columns?: { name: string; value: string; description?: string }
  className?: string
}

export function TokenTable({
  tokens,
  columns = { name: "Token", value: "Value" },
  className,
}: TokenTableProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyValue(value: string) {
    navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Table className={cn(className)}>
      <TableHeader>
        <TableRow>
          <TableHead>{columns.name}</TableHead>
          <TableHead>{columns.value}</TableHead>
          {columns.description && <TableHead>{columns.description}</TableHead>}
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tokens.map((token) => (
          <TableRow key={token.name}>
            <TableCell className="font-mono text-sm">{token.name}</TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-2">
                {token.preview && (
                  <span
                    className="inline-block size-4 rounded-sm border border-border"
                    style={{ backgroundColor: token.preview }}
                  />
                )}
                <span className="font-mono text-xs text-muted-foreground">{token.value}</span>
              </span>
            </TableCell>
            {columns.description && (
              <TableCell className="text-sm text-muted-foreground">{token.description}</TableCell>
            )}
            <TableCell>
              <button
                onClick={() => copyValue(token.value)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied === token.value ? (
                  <Check className="size-3.5 text-[var(--color-malachite)]" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
