import { Placeholder } from "@/components/placeholder";
import { requireSupervisor } from "@/lib/session";

export default async function NewShiftPage() {
  await requireSupervisor();
  return (
    <Placeholder title="New shift" week="week 3">
      Create a shift with a date, time, role and assigned student.
    </Placeholder>
  );
}
