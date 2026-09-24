import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/database.types";

export type ShiftStatus = Database["public"]["Enums"]["swap_status"] | "expired";

// Badge words and colours from DESIGN.md. Students see "Covered", not "approved".
const STATUS = {
  open: { label: "Needs cover", variant: "open" },
  pending: { label: "Waiting for approval", variant: "pending" },
  approved: { label: "Covered", variant: "approved" },
  denied: { label: "Denied", variant: "closed" },
  cancelled: { label: "Cancelled", variant: "closed" },
  expired: { label: "Expired", variant: "closed" },
} as const;

export function StatusBadge({ status }: { status: ShiftStatus }) {
  const { label, variant } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
