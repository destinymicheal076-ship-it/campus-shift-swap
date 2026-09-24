import { Nav } from "@/components/nav";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          <Card>
            <CardHeader>
              <CardTitle>You&apos;re not in a workplace yet</CardTitle>
              <CardDescription>
                Ask your supervisor to add you. For the demo, log in with one of the
                seeded accounts listed in the README.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </>
  );
}
