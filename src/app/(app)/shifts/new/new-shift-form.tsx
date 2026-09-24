"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createShift, type NewShiftState } from "./actions";

export type RoleOption = { id: string; name: string };
export type StudentOption = { id: string; name: string; roleIds: string[] };

// Native select, styled like Input, so it submits with the form and works
// with phone pickers.
const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm";

export function NewShiftForm({
  roles,
  students,
  today,
}: {
  roles: RoleOption[];
  students: StudentOption[];
  today: string;
}) {
  const [roleId, setRoleId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const eligible = students.filter((s) => s.roleIds.includes(roleId));

  // After a save: toast, and clear the student so the next shift is quick to add.
  const [state, action, pending] = useActionState<NewShiftState, FormData>(async (prev, formData) => {
    const result = await createShift(prev, formData);
    if (result.savedAt && result.message) {
      toast.success(result.message);
      setAssigneeId("");
    }
    return result;
  }, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="date" label="Date">
        <Input name="date" type="date" min={today} defaultValue={today} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id="start" label="Start">
          <Input name="start" type="time" defaultValue="09:00" step={900} required />
        </Field>
        <Field id="end" label="End">
          <Input name="end" type="time" defaultValue="13:00" step={900} required />
        </Field>
      </div>
      <Field id="role_id" label="Role">
        <select
          name="role_id"
          className={selectClass}
          value={roleId}
          onChange={(e) => {
            setRoleId(e.target.value);
            setAssigneeId("");
          }}
        >
          <option value="">Pick a role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="assignee_id"
        label="Student"
        hint={roleId ? "Only students with this role are listed." : "Pick a role first."}
      >
        <select
          name="assignee_id"
          className={selectClass}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          disabled={!roleId}
        >
          <option value="">{roleId && eligible.length === 0 ? "No students have this role" : "Pick a student"}</option>
          {eligible.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      {state.error && (
        <p role="alert" className="text-small text-destructive">
          {state.error}
        </p>
      )}
      {state.message && !state.error && (
        <p role="status" className="text-small text-muted-foreground">
          {state.message}{" "}
          <Link href="/schedule?view=everyone" className="text-primary underline-offset-4 hover:underline">
            View schedule
          </Link>
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Please wait…" : "Add shift"}
      </Button>
    </form>
  );
}
