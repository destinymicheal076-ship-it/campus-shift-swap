import { Nav } from "@/components/nav";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <>
      <Nav session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        {session.workplace ? (
          children
        ) : (
          <EmptyState
            icon={Building2}
            title="You're not in a workplace yet"
            description="Ask your supervisor to add you. For the demo, log in with one of the seeded accounts in the README."
          />
        )}
      </main>
    </>
  );
}
