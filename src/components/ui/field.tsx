import * as React from "react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"

// A label, one control, and an optional hint or error, wired up for screen
// readers. Pass the control as the child; Field adds id and aria props to it.
function Field({
  label,
  hint,
  error,
  id,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string
  id: string
  className?: string
  children: React.ReactElement<React.ComponentProps<"input">>
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div data-slot="field" className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="text-small text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { Field }
