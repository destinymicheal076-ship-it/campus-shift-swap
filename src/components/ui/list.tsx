import * as React from "react"
import { cn } from "cn"

// Rows separated by dividers, usually inside a Card. Each ListItem has up to
// four slots: leading (a time), title, meta (a name or note) and trailing
// (a badge or button). On a phone the row wraps instead of squeezing.
function List({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="list"
      className={cn("flex flex-col divide-y divide-border", className)}
      {...props}
    />
  )
}

function ListItem({
  leading,
  title,
  meta,
  trailing,
  className,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  leading?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <li
      data-slot="list-item"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0",
        className
      )}
      {...props}
    >
      {leading && (
        <div className="min-w-24 text-body font-medium tabular-nums">{leading}</div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="text-body">{title}</div>
        {meta && <div className="text-small text-muted-foreground">{meta}</div>}
      </div>
      {trailing && (
        // A form opened inside the row (like the cover note) takes the full width.
        <div className="flex flex-wrap items-center gap-2 has-[form]:basis-full">{trailing}</div>
      )}
    </li>
  )
}

export { List, ListItem }
