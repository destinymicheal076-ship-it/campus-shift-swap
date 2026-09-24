"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function ModalDemo() {
  return (
    <ConfirmDialog
      trigger={<Button variant="outline">Cancel request…</Button>}
      title="Cancel your cover request?"
      description="Your Thu 9am–1pm shift goes back to you, and coworkers can no longer claim it."
      confirmLabel="Cancel request"
      destructive
      onConfirm={() => {
        toast("Request cancelled. The shift is yours again.");
      }}
    />
  );
}

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast("Your Thu 9am–1pm shift is posted.")}
      >
        Info toast
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success("Covered. Jordan is working Thu 9am–1pm.")}
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("You already have a shift then (Thu 10am–2pm). Pick a different one.")
        }
      >
        Error toast
      </Button>
    </div>
  );
}
