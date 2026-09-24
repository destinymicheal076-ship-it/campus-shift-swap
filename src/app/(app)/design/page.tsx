import { CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { List, ListItem } from "@/components/ui/list";
import { ModalDemo, ToastDemo } from "./demos";

// Living style guide for DESIGN.md: every token and component on one page.
// Not linked from the nav; open /design while logged in.

const COLORS = [
  ["Brand", "bg-primary", "#4F46E5"],
  ["Ink", "bg-foreground", "#18181B"],
  ["Muted", "bg-muted-foreground", "#71717A"],
  ["Page", "bg-background", "#FAFAFA"],
  ["Surface", "bg-card", "#FFFFFF"],
  ["Border", "bg-border", "#E4E4E7"],
  ["Danger", "bg-destructive", "#DC2626"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-title">Design system</h1>
        <p className="text-body text-muted-foreground">Tokens and components from DESIGN.md.</p>
      </div>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLORS.map(([name, cls, hex]) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`size-8 rounded-md border ${cls}`} />
              <div className="text-small">
                <div className="font-medium">{name}</div>
                <div className="text-muted-foreground tabular-nums">{hex}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="open" />
          <StatusBadge status="pending" />
          <StatusBadge status="approved" />
          <StatusBadge status="denied" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="expired" />
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-1">
          <p className="text-title">Title: Main Library schedule</p>
          <p className="text-heading">Heading: Thursday, Sep 24</p>
          <p className="text-body">Body: Jordan claimed your Thu 9am shift.</p>
          <p className="text-small text-muted-foreground">Small: Circulation Desk</p>
          <p className="text-body tabular-nums">Times: 9:00 AM–1:00 PM · 11:00 AM–3:00 PM</p>
        </div>
      </Section>

      <Section title="1. Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Claim shift</Button>
          <Button variant="outline">View schedule</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Deny</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="2. Input">
        <div className="grid max-w-sm gap-4">
          <Field id="demo-name" label="Full name">
            <Input placeholder="Alex Chen" />
          </Field>
          <Field id="demo-note" label="Note (optional)" hint="Your coworkers see this.">
            <Input placeholder="Exam that morning" />
          </Field>
          <Field id="demo-email" label="Email" error="Enter an email address like alex@school.edu.">
            <Input type="email" defaultValue="alex@" />
          </Field>
          <Field id="demo-disabled" label="Workplace">
            <Input disabled defaultValue="Main Library" />
          </Field>
        </div>
      </Section>

      <Section title="3. Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-heading">Thursday, Sep 24</CardTitle>
            <CardDescription>Cards group one day, one form or one request.</CardDescription>
          </CardHeader>
          <CardContent className="text-body">Flat, with a border and no shadow.</CardContent>
        </Card>
      </Section>

      <Section title="4. List">
        <Card>
          <CardContent>
            <List>
              <ListItem
                leading="9:00 AM–1:00 PM"
                title="You"
                meta="Exam that morning"
                trailing={<StatusBadge status="open" />}
              />
              <ListItem
                leading="1:00 PM–5:00 PM"
                title="Jordan Patel"
                trailing={<Badge variant="secondary">Circulation Desk</Badge>}
              />
              <ListItem
                leading="10:00 AM–2:00 PM"
                title="Casey Okafor"
                meta="Claimed by Riley Nguyen"
                trailing={<StatusBadge status="pending" />}
              />
            </List>
          </CardContent>
        </Card>
      </Section>

      <Section title="5. Nav">
        <p className="text-body text-muted-foreground">
          The bar at the top of this page. The current page is highlighted and marked
          with <code>aria-current</code>. Supervisors also see Approvals and New shift.
        </p>
      </Section>

      <Section title="6. Modal">
        <div>
          <ModalDemo />
        </div>
      </Section>

      <Section title="7. Empty state">
        <EmptyState
          icon={CalendarX2}
          title="No open shifts right now"
          description="When a coworker needs cover for a Circulation Desk shift, it shows up here."
          action={<Button variant="outline">View schedule</Button>}
        />
      </Section>

      <Section title="8. Toast">
        <ToastDemo />
      </Section>
    </div>
  );
}
