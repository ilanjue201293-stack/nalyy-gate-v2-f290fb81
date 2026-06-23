import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles, Zap, Crown, Infinity as InfinityIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PublicAuthButton } from "@/components/public-auth-button";
import { apiClient } from "@/lib/api-client";
import { formatLimit, normalizePlan, plans, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing - Nalyy Gate" },
      {
        name: "description",
        content: "Simple, transparent pricing for script developers.",
      },
      { property: "og:title", content: "Pricing - Nalyy Gate" },
      {
        property: "og:description",
        content: "From free testing tier to unlimited scripts, keys and whitelists.",
      },
    ],
  }),
  component: Pricing,
});

const icons: Record<PlanId, typeof Sparkles> = {
  free: Sparkles,
  plus: Zap,
  pro: Crown,
  unlimited: InfinityIcon,
};

function Pricing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.me().catch(() => ({ user: null })),
    retry: false,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
  const activePlan = normalizePlan(meQuery.data?.user?.plan);
  const selectPlan = useMutation({
    mutationFn: apiClient.selectPlan,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(`Plan updated to ${data.plan}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Plan update failed"),
  });

  const choosePlan = (plan: PlanId) => {
    if (!meQuery.data?.user) {
      navigate({ to: "/login" });
      return;
    }
    selectPlan.mutate(plan);
  };

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
            <Link to="/bot" className="hover:text-foreground">Bot</Link>
          </nav>
          <PublicAuthButton variant="hero" size="sm" />
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
              Simple plans. <span className="text-gradient">Real limits.</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Pick a plan and Nalyy Gate applies its script, key and whitelist limits automatically.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const Icon = icons[plan.id];
              const isActive = activePlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={
                    "relative flex flex-col overflow-hidden rounded-2xl border bg-card/50 p-6 backdrop-blur transition " +
                    (plan.highlight || isActive
                      ? "border-primary/60 shadow-elegant ring-1 ring-primary/40"
                      : "border-border hover:border-primary/40")
                  }
                >
                  {isActive && (
                    <div className="absolute right-4 top-4 rounded-full border border-success/40 bg-success/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-success">
                      Current
                    </div>
                  )}
                  {!isActive && plan.highlight && (
                    <div className="absolute right-4 top-4 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                      Popular
                    </div>
                  )}
                  <div className="inline-grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-gradient">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>

                  <div className="mt-5 space-y-2 rounded-xl border border-border bg-background/40 p-3 text-xs">
                    <Limit label="Scripts" value={formatLimit(plan.limits.scripts, "scripts")} />
                    <Limit label="Keys" value={formatLimit(plan.limits.keys, "keys")} />
                    <Limit label="Whitelist" value={formatLimit(plan.limits.whitelist, "whitelist")} />
                  </div>

                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    variant={plan.highlight ? "hero" : "outline"}
                    size="lg"
                    className="mt-6 w-full"
                    disabled={isActive || selectPlan.isPending}
                    onClick={() => choosePlan(plan.id)}
                  >
                    {isActive ? "Current plan" : `Choose ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
