"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  cancelRequest,
  claimShift,
  decideRequest,
  requestCover,
  type SwapResult,
} from "@/app/(app)/swap-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Buttons for each step of the swap flow. Each calls a Server Action,
// then shows its message as a toast. The page itself re-renders with the
// new status, so the toast is never the only record.

function report(result: SwapResult) {
  if (result.error) toast.error(result.error);
  else if (result.message) toast.success(result.message);
}

// "Request cover" opens an inline note field in the row (DESIGN.md: no
// forms in modals).
export function RequestCoverButton({ shiftId }: { shiftId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Request cover
      </Button>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-2 pt-2"
      action={(formData) =>
        start(async () => {
          const result = await requestCover(shiftId, String(formData.get("note") ?? ""));
          report(result);
          if (!result.error) setOpen(false);
        })
      }
    >
      <Field id={`note-${shiftId}`} label="Note (optional)" hint="Your coworkers see this.">
        <Input name="note" maxLength={200} placeholder="Exam that morning" autoFocus />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Please wait…" : "Post shift"}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Never mind
        </Button>
      </div>
    </form>
  );
}

export function CancelRequestButton({ requestId, label }: { requestId: string; label: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="destructive">
          Cancel request
        </Button>
      }
      title="Cancel your cover request?"
      description={`Your ${label} shift goes back to you, and coworkers can no longer claim it.`}
      confirmLabel="Cancel request"
      destructive
      onConfirm={async () => report(await cancelRequest(requestId))}
    />
  );
}

export function ClaimButton({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button disabled={pending} onClick={() => start(async () => report(await claimShift(requestId)))}>
      {pending ? "Please wait…" : "Claim shift"}
    </Button>
  );
}

export function DecisionButtons({
  requestId,
  claimer,
  label,
}: {
  requestId: string;
  claimer: string;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button disabled={pending} onClick={() => start(async () => report(await decideRequest(requestId, true)))}>
        {pending ? "Please wait…" : "Approve"}
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="destructive" disabled={pending}>
            Deny
          </Button>
        }
        title={`Deny ${claimer}'s claim?`}
        description={`The ${label} shift goes back to needing cover, and ${claimer} won't work it.`}
        confirmLabel="Deny swap"
        destructive
        onConfirm={async () => report(await decideRequest(requestId, false))}
      />
    </div>
  );
}
