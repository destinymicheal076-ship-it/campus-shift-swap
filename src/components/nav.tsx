import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/nav-links";
import type { Session } from "@/lib/session";

export function Nav({ session }: { session: Session }) {
  const links = [
    { href: "/schedule", label: "Schedule" },
    { href: "/open-shifts", label: "Open shifts" },
    ...(session.isSupervisor
      ? [
          { href: "/approvals", label: "Approvals" },
          { href: "/shifts/new", label: "New shift" },
        ]
      : []),
  ];

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/schedule" className="text-heading text-primary">
          Shift Swap
        </Link>
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-2 text-body">
          <span className="hidden text-muted-foreground sm:inline">{session.fullName}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
