import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
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
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/schedule" className="font-semibold">
          Shift Swap
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
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
