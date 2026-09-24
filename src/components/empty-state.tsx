import type { LucideIcon } from "lucide-react";

// Shown when a page or list has nothing in it. Says what's missing in a few
// words and, when there's something to do about it, offers one action.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-10 text-center"
    >
      {Icon && (
        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <h2 className="text-heading">{title}</h2>
      {description && (
        <p className="max-w-sm text-body text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
