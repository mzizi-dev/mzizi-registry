// Props of the mzizi N2 primitives, from components/registry/n2-primitives/*.tsx (documentation only).
import type * as React from "react"
export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm"
  asChild?: boolean
}
export type InputProps = React.ComponentProps<"input">
export interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
  asChild?: boolean
}
export interface CardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm"
  loading?: boolean
}
export interface SwitchProps {
  size?: "sm" | "default"
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}
export interface CheckboxProps {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  disabled?: boolean
}
export interface TabsProps {
  orientation?: "horizontal" | "vertical"
  value?: string
  onValueChange?: (value: string) => void
}
export interface TabsListProps extends React.ComponentProps<"div"> {
  variant?: "default" | "line"
}
