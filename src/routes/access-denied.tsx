import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access Denied — Nalyy Gate" },
      { name: "description", content: "You don't have access to this script." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    script: typeof s.script === "string" ? s.script : undefined,
    reason: typeof s.reason === "string" ? s.reason : undefined,
  }),
  component: AccessDenied,
});

function AccessDenied() {
  const { script, reason } = useSearch({ from: "/access-denied" });
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.62_0.26_30/0.18),transparent_60%)]" />

      <Link
        to="/"
        className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card/70 p-8 text-center shadow-elegant backdrop-blur-xl">
        <div className="mx-auto inline-flex">
          <Logo className="h-12 w-12 opacity-60" />
        </div>
        <div className="mx-auto mt-6 grid h-16 w-16 place-items-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Access Denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {reason ??
            "You don't have permission to access this script. Make sure your key is valid, not expired, and that your HWID is whitelisted."}
        </p>

        {script ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">
            <KeyRound className="h-3 w-3" /> script:{script}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-2">
          <Button asChild variant="hero" size="lg">
            <Link to="/login">Sign in with Discord</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Error code: <span className="font-mono text-foreground">NG_403_NO_ACCESS</span>
        </p>
      </div>
    </div>
  );
}
