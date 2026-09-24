"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <CardTitle>{isSignup ? "Create an account" : "Log in"}</CardTitle>
        <CardDescription>Campus Shift Swap</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          {isSignup && (
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required autoComplete="name" />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
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
