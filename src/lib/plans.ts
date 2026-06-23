export type PlanId = "free" | "plus" | "pro" | "unlimited";

export const plans = [
  {
    id: "free",
    name: "Free",
    price: "0 EUR",
    period: "/ forever",
    tagline: "Test the gate, no card required.",
    limits: { scripts: 5, keys: 15, whitelist: 5 },
    features: ["Free mode & Key system", "Lifetime keys", "HWID lock", "Basic statistics"],
  },
  {
    id: "plus",
    name: "Plus",
    price: "5 EUR",
    period: "/ month",
    tagline: "For solo devs shipping their first paid scripts.",
    limits: { scripts: 15, keys: 30, whitelist: 20 },
    features: ["Trial mode", "One-time keys", "Stats per user", "More script slots"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "15 EUR",
    period: "/ month",
    tagline: "For serious script teams.",
    limits: { scripts: 30, keys: 70, whitelist: 50 },
    features: ["Everything in Plus", "Advanced statistics", "Multi-HWID keys", "Priority support"],
    highlight: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "25 EUR",
    period: "/ month",
    tagline: "No limits. Ship as much as you want.",
    limits: { scripts: Infinity, keys: Infinity, whitelist: Infinity },
    features: ["Everything in Pro", "Unlimited scripts", "Unlimited keys", "Unlimited whitelist"],
  },
] satisfies {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  limits: { scripts: number; keys: number; whitelist: number };
  features: string[];
  highlight?: boolean;
}[];

export function normalizePlan(plan?: string | null): PlanId {
  if (plan === "plus" || plan === "pro" || plan === "unlimited") return plan;
  return "free";
}

export function getPlan(plan?: string | null) {
  const id = normalizePlan(plan);
  return plans.find((item) => item.id === id) ?? plans[0];
}

export function formatLimit(value: number, label: string) {
  return value === Infinity ? `Unlimited ${label}` : `${value} ${label}`;
}
