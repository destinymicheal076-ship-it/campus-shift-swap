import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Stand-in for pages that are built later in todo.md.
export function Placeholder({ title, week, children }: {
  title: string;
  week: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {children} Coming in {week} of todo.md.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
