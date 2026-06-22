import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Nalyy Gate" }] }),
  component: Login,
});

function Login() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.62_0.26_295/0.25),transparent_60%)]" />

      <Link
        to="/"
        className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 shadow-elegant backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary glow-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Welcome to Nalyy Gate</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Discord to access your dashboard.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button asChild variant="discord" size="lg" className="w-full">
            <Link to="/dashboard">
              <DiscordIcon /> Continue with Discord
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/dashboard">Continue as Guest (demo)</Link>
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Protected by OAuth 2.0 · Your data is never shared.
        </div>
      </div>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.6 13.6 0 0 0-.617 1.249 18.27 18.27 0 0 0-5.487 0A13.6 13.6 0 0 0 9.836 3a19.79 19.79 0 0 0-3.76 1.369C2.42 9.79 1.43 15.087 1.923 20.31a19.94 19.94 0 0 0 6.062 3.04 14.7 14.7 0 0 0 1.296-2.082 12.83 12.83 0 0 1-2.04-.973c.171-.124.339-.253.501-.386 3.927 1.793 8.18 1.793 12.063 0 .163.133.331.262.501.386a12.85 12.85 0 0 1-2.043.974 14.7 14.7 0 0 0 1.296 2.082 19.94 19.94 0 0 0 6.064-3.04c.576-6.063-.985-11.314-3.846-15.94zM8.02 16.32c-1.183 0-2.157-1.085-2.157-2.42 0-1.335.953-2.42 2.157-2.42 1.204 0 2.178 1.095 2.157 2.42 0 1.335-.962 2.42-2.157 2.42zm7.974 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.335.954-2.42 2.157-2.42 1.204 0 2.178 1.095 2.157 2.42 0 1.335-.953 2.42-2.157 2.42z" />
    </svg>
  );
}
