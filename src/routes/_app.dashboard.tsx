import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileCode2,
  KeyRound,
  Users,
  Activity,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  scripts,
  keys,
  totals,
  executionsByDay,
} from "@/lib/mock-data";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Nalyy Gate" }] }),
  component: Dashboard,
});

function Dashboard() {
  const statsQuery = useQuery({ queryKey: ["stats", "global"], queryFn: apiClient.globalStats });
  const scriptsQuery = useQuery({ queryKey: ["scripts"], queryFn: apiClient.scripts });
  const keysQuery = useQuery({ queryKey: ["keys"], queryFn: apiClient.keys });
  const liveTotals = statsQuery.data?.totals ?? totals;
  const liveExecutions = statsQuery.data?.executionsByDay ?? executionsByDay;
  const liveScripts = scriptsQuery.data ?? scripts;
  const liveKeys = keysQuery.data ?? keys;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back — here's a snapshot of your script empire."
        actions={
          <Button asChild variant="hero" size="sm">
            <Link to="/scripts/add">
              <PlusCircle className="h-4 w-4" /> New Script
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Scripts"
          value={liveTotals.scripts}
          hint={`${liveTotals.activeScripts} active`}
          icon={FileCode2}
          accent="primary"
        />
        <StatCard
          label="Active Keys"
          value={liveTotals.activeKeys}
          hint={`${liveTotals.keys} generated`}
          icon={KeyRound}
          accent="accent"
        />
        <StatCard
          label="Whitelisted"
          value={liveTotals.whitelistUsers}
          hint={`${liveTotals.onlineUsers} active`}
          icon={Users}
          accent="success"
        />
        <StatCard
          label="Executions (7d)"
          value={liveTotals.executions.toLocaleString()}
          hint="Verified requests"
          icon={Activity}
          accent="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Executions</h3>
              <p className="text-xs text-muted-foreground">Last 7 days across all scripts</p>
            </div>
            <Badge variant="outline" className="border-success/40 text-success">
              <TrendingUp className="mr-1 h-3 w-3" /> +12.4%
            </Badge>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveExecutions}>
                <defs>
                  <linearGradient id="gradExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.26 295)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.62 0.26 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.3 0.04 280 / 0.3)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0.03 270)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.03 280)",
                    border: "1px solid oklch(0.62 0.26 295 / 0.4)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="execs"
                  stroke="oklch(0.62 0.26 295)"
                  strokeWidth={2}
                  fill="url(#gradExec)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent Keys</h3>
            <Link to="/keys" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {liveKeys.slice(0, 5).map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs text-foreground">{k.key}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {k.scriptName} · {k.duration}
                  </div>
                </div>
                <KeyStatus status={k.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Top Scripts</h3>
          <Link to="/scripts" className="text-xs text-accent hover:underline">
            Manage scripts <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Script</th>
                <th className="pb-3 font-medium">Game</th>
                <th className="pb-3 font-medium">Users</th>
                <th className="pb-3 font-medium">Executions</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {liveScripts.slice(0, 4).map((s) => (
                <tr key={s.id} className="text-foreground/90">
                  <td className="py-3">
                    <Link
                      to="/scripts/$id"
                      params={{ id: s.id }}
                      className="font-medium hover:text-primary"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">{s.game}</td>
                  <td className="py-3">{s.users.toLocaleString()}</td>
                  <td className="py-3">{s.executions.toLocaleString()}</td>
                  <td className="py-3">
                    <ScriptStatus status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function KeyStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "border-success/40 text-success bg-success/10",
    unused: "border-accent/40 text-accent bg-accent/10",
    expired: "border-muted-foreground/40 text-muted-foreground bg-muted/30",
    revoked: "border-destructive/40 text-destructive bg-destructive/10",
  };
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function ScriptStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "border-success/40 text-success bg-success/10",
    paused: "border-warning/40 text-warning bg-warning/10",
    draft: "border-muted-foreground/40 text-muted-foreground bg-muted/30",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
