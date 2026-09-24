import { Construction } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Stand-in for pages that are built later in todo.md.
export function Placeholder({ title, week, children }: {
  title: string;
  week: string;
  children: React.ReactNode;
}) {
  return (
    <EmptyState
      icon={Construction}
      title={title}
      description={<>{children} Coming in {week} of todo.md.</>}
    />
  );
}
