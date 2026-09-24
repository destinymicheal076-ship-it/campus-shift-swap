import { Placeholder } from "@/components/placeholder";
import { requireSupervisor } from "@/lib/session";

export default async function ApprovalsPage() {
  await requireSupervisor();
  return (
    <Placeholder title="Approvals" week="weeks 4–5">
      Claimed shifts waiting for you to approve or deny.
    </Placeholder>
  );
}
