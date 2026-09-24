import { Tags } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSupervisor } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { todayInZone } from "@/lib/time";
import { NewShiftForm, type StudentOption } from "./new-shift-form";

export default async function NewShiftPage() {
  const session = await requireSupervisor();
  const workplaceId = session.workplace!.id;
  const supabase = await createClient();

  const [{ data: roles, error: rolesError }, { data: members, error: membersError }] = await Promise.all([
    supabase.from("roles").select("id, name").eq("workplace_id", workplaceId).order("name"),
    supabase
      .from("memberships")
      .select("user_id, is_supervisor, profiles (full_name, user_roles (role_id))")
      .eq("workplace_id", workplaceId),
  ]);
  const error = rolesError ?? membersError;

  const students: StudentOption[] = (members ?? [])
    .filter((m) => !m.is_supervisor)
    .map((m) => ({
      id: m.user_id,
      name: m.profiles?.full_name || "Unnamed student",
      roleIds: (m.profiles?.user_roles ?? []).map((r) => r.role_id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title">New shift</h1>
      {error ? (
        <p role="alert" className="text-small text-destructive">
          Couldn&apos;t load roles and students. {error.message}
        </p>
      ) : !roles?.length ? (
        <EmptyState
          icon={Tags}
          title="No roles yet"
          description="Shifts need a role, like Circulation Desk. Roles come from the seed data for now."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-heading">{session.workplace!.name}</CardTitle>
            <CardDescription>Times are campus time.</CardDescription>
          </CardHeader>
          <CardContent>
            <NewShiftForm roles={roles} students={students} today={todayInZone()} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
