import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCode2, KeyRound, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Nalyy Gate" },
      {
        name: "description",
        content:
          "Three simple steps: set up your scripts, create your keys, manage your scripts.",
      },
      { property: "og:title", content: "How Nalyy Gate works" },
      {
        property: "og:description",
        content: "Set up scripts, create keys, manage everything from one dashboard.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    icon: FileCode2,
    title: "Set up your scripts",
    desc: "Upload your script and pick a license mode: free, trial or key system. We hand you back a secure loader and an API link in one click.",
  },
  {
    icon: KeyRound,
    title: "Create your keys",
    desc: "Generate HWID-locked, lifetime, trial or one-time keys. Lock a key to a specific Discord ID when you want zero resellers.",
  },
  {
    icon: ShieldCheck,
    title: "Manage your scripts",
    desc: "Track executions, manage whitelists, revoke compromised keys and watch your stats live — everything from one futuristic dashboard.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <span className="font-display text-lg font-bold text-gradient">Nalyy Gate</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/how-it-works" className="text-foreground">How it works</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <Button asChild variant="hero" size="sm">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.26_295/0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
              How it works
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl">
              Three steps. <span className="text-gradient">That's it.</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Simple, efficient, no fluff.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-6 backdrop-blur transition hover:border-primary/50"
              >
                <div className="absolute right-4 top-4 font-display text-5xl font-bold text-primary/10">
                  0{i + 1}
                </div>
                <div className="inline-grid h-12 w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button asChild variant="hero" size="lg">
              <Link to="/login">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
