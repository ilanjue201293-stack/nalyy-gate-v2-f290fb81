import { createFileRoute, Link } from "@tanstack/react-router";
import {
  KeyRound,
  ShieldCheck,
  FileCode2,
  BarChart3,
  Cpu,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nalyy Gate — The Gate to Your Scripts" },
      {
        name: "description",
        content:
          "Manage scripts, key systems, whitelists and Discord users from one futuristic dashboard.",
      },
      { property: "og:title", content: "Nalyy Gate" },
      {
        property: "og:description",
        content: "The premium dashboard for script developers.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: FileCode2,
    title: "Script Manager",
    desc: "Upload, version and deploy your scripts with an obfuscated loader and per-game targeting.",
  },
  {
    icon: KeyRound,
    title: "Key System",
    desc: "Generate timed, lifetime or batch keys. Sell, gift or revoke them in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Whitelist & HWID",
    desc: "Hardware-locked access tied to Discord roles. Stop sharing and resellers cold.",
  },
  {
    icon: BarChart3,
    title: "Realtime Stats",
    desc: "Track executions, active users and revenue across every script you ship.",
  },
  {
    icon: Cpu,
    title: "Discord OAuth",
    desc: "Sign-in with Discord and sync roles automatically with your premium tiers.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <span className="font-display text-lg font-bold text-gradient">Nalyy Gate</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.26_295/0.3),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary backdrop-blur">
              <Lock className="h-3 w-3" />
              Now in private beta · v2.0
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              The <span className="text-gradient">gate</span> to your
              <br />
              script empire.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Manage scripts, key systems, whitelists and Discord users from one
              futuristic dashboard built for serious developers.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/login">
                  Login with Discord <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="neon" size="lg">
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-4 text-center">
              {[
                ["12.4K", "Active scripts"],
                ["1.8M", "Keys generated"],
                ["98ms", "Avg. loader time"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur">
                  <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">{v}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-widest text-accent">Everything you need</div>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            One platform. Every script tool.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop juggling Pastebin, Discord bots and spreadsheets. Nalyy Gate replaces them all.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 backdrop-blur transition hover:border-primary/50 hover:bg-card/70"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 opacity-0 blur-3xl transition group-hover:opacity-100" />
              <div className="relative">
                <div className="inline-grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-accent/15 p-10 text-center backdrop-blur">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Ready to ship your next script?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Free during beta. No credit card. Connect your Discord and you're live in 60 seconds.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">View Demo Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div>© 2026 Nalyy Gate. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
