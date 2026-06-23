import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Zap, Crown, Infinity as InfinityIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nalyy Gate" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for script developers. Free, Plus, Pro and Unlimited plans.",
      },
      { property: "og:title", content: "Pricing — Nalyy Gate" },
      {
        property: "og:description",
        content: "From free testing tier to unlimited scripts, keys and whitelists.",
      },
    ],
  }),
  component: Pricing,
});

type Plan = {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  icon: typeof Sparkles;
  highlight?: boolean;
  cta: string;
  features: string[];
  limits: { scripts: string; keys: string; whitelist: string };
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "0€",
    period: "/ forever",
    tagline: "Test the gate, no card required.",
    icon: Sparkles,
    cta: "Start Free",
    limits: { scripts: "5 scripts", keys: "15 keys", whitelist: "5 whitelist" },
    features: [
      "Free mode & Key system",
      "Lifetime keys",
      "HWID lock & Discord ID lock",
      "Basic statistics",
      "Community support",
    ],
  },
  {
    name: "Plus",
    price: "5€",
    period: "/ month",
    tagline: "For solo devs shipping their first paid scripts.",
    icon: Zap,
    cta: "Go Plus",
    limits: { scripts: "15 scripts", keys: "30 keys", whitelist: "20 whitelist" },
    features: [
      "Best rentability plan",
      "Trial mode (custom duration)",
      "One-time keys",
      "Stats per user",
    ],
  },
  {
    name: "Pro",
    price: "15€",
    period: "/ month",
    tagline: "For serious script empires with paying users.",
    icon: Crown,
    highlight: true,
    cta: "Go Pro",
    limits: { scripts: "30 scripts", keys: "70 keys", whitelist: "50 whitelist" },
    features: [
      "Everything in Plus",
      "Advanced statistics",
      "Multi-HWID keys",
      "Priority Discord support",
    ],
  },
  {
    name: "Unlimited",
    price: "25€",
    period: "/ month",
    tagline: "No limits. Ship as much as you want.",
    icon: InfinityIcon,
    cta: "Go Unlimited",
    limits: { scripts: "Unlimited scripts", keys: "Unlimited keys", whitelist: "Unlimited whitelist" },
    features: [
      "Everything in Pro",
      "Zero limits across the board",
      "Early access to new features",
    ],
  },
];

function Pricing() {
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
            <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
            <Link to="/pricing" className="text-foreground">Pricing</Link>
          </nav>
          <Button asChild variant="hero" size="sm">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.26_295/0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
              Pricing
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl">
              Simple plans. <span className="text-gradient">Real power.</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Start free, scale when you need to. Cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  "relative flex flex-col overflow-hidden rounded-2xl border bg-card/50 p-6 backdrop-blur transition " +
                  (p.highlight
                    ? "border-primary/60 shadow-elegant ring-1 ring-primary/40"
                    : "border-border hover:border-primary/40")
                }
              >
                {p.highlight && (
                  <div className="absolute right-4 top-4 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                    Most popular
                  </div>
                )}
                <div className="inline-grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-gradient">{p.price}</span>
                  {p.period && (
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  )}
                </div>

                <div className="mt-5 space-y-2 rounded-xl border border-border bg-background/40 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scripts</span>
                    <span className="font-medium">{p.limits.scripts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Keys</span>
                    <span className="font-medium">{p.limits.keys}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Whitelist</span>
                    <span className="font-medium">{p.limits.whitelist}</span>
                  </div>
                </div>

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={p.highlight ? "hero" : "outline"}
                  size="lg"
                  className="mt-6 w-full"
                >
                  <Link to="/login">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            All prices in EUR. VAT may apply. Upgrade or downgrade anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
