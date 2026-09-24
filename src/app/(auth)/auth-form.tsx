"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { login, signup, type AuthState } from "./actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isSignup ? signup : login,
    {},
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-title">{isSignup ? "Create an account" : "Log in"}</CardTitle>
        <CardDescription>Campus Shift Swap</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          {isSignup && (
            <Field id="full_name" label="Full name">
              <Input name="full_name" required autoComplete="name" />
            </Field>
          )}
          <Field id="email" label="Email">
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field
            id="password"
            label="Password"
            hint={isSignup ? "At least 6 characters." : undefined}
          >
            <Input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </Field>
          {state.error && (
            <p role="alert" className="text-small text-destructive">{state.error}</p>
          )}
          {state.message && (
            <p role="status" className="text-small text-muted-foreground">{state.message}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
          </Button>
          <p className="text-center text-small text-muted-foreground">
            {isSignup ? (
              <>Already have an account? <Link href="/login" className="underline">Log in</Link></>
            ) : (
              <>No account? <Link href="/signup" className="underline">Sign up</Link></>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
