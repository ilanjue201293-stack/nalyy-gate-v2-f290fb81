import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, KeyRound, Users, FileCode2 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { PageHeader, StatCard } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { totals, executionsByDay } from "@/lib/mock-data";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/statistics")({
  head: () => ({ meta: [{ title: "Statistics — Nalyy Gate" }] }),
  component: Statistics,
});

type UserRow = {
  tag: string;
  discordId: string;
  executions: number;
  scriptsUsed: number;
  lastActive: string;
  joined: string;
  hwids: number;
  topScript: string;
  weekly: { day: string; execs: number }[];
};

function Statistics() {
  const [selected, setSelected] = useState<UserRow | null>(null);
  const statsQuery = useQuery({ queryKey: ["stats", "global"], queryFn: apiClient.globalStats });
  const liveTotals = statsQuery.data?.totals ?? totals;
  const liveExecutions = statsQuery.data?.executionsByDay ?? executionsByDay;
  const topUsers = statsQuery.data?.topUsers ?? [];

  const tooltipStyle = {
    background: "oklch(0.17 0.03 280)",
    border: "1px solid oklch(0.62 0.26 295 / 0.4)",
    borderRadius: 12,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Statistics"
        description="Deep insights across every script, key and user."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scripts" value={liveTotals.scripts} icon={FileCode2} accent="primary" />
        <StatCard label="Active keys" value={liveTotals.activeKeys} icon={KeyRound} accent="accent" />
        <StatCard label="Whitelist" value={liveTotals.whitelistUsers} icon={Users} accent="success" />
        <StatCard label="Executions" value={liveTotals.executions.toLocaleString()} icon={Activity} accent="warning" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <MiniStat label="Free scripts" value={statsQuery.data?.accessModes?.free ?? 0} />
        <MiniStat label="Trial scripts" value={statsQuery.data?.accessModes?.trial ?? 0} />
        <MiniStat label="Key scripts" value={statsQuery.data?.accessModes?.key ?? 0} />
        <MiniStat label="Active trials" value={statsQuery.data?.accessModes?.activeTrials ?? 0} />
      </div>

      <Panel title="Executions over time" subtitle="Last 7 days">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={liveExecutions}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.2 265)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.7 0.2 265)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.3 0.04 280 / 0.3)" vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.7 0.03 270)" fontSize={12} />
            <YAxis stroke="oklch(0.7 0.03 270)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="execs" stroke="oklch(0.7 0.2 265)" strokeWidth={2} fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Top users" subtitle="Click a user to open detailed stats">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Executions</th>
                <th className="pb-3 font-medium">Scripts used</th>
                <th className="pb-3 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {topUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No user executions yet.
                  </td>
                </tr>
              ) : topUsers.map((u) => (
                <tr
                  key={u.tag}
                  onClick={() => setSelected(u)}
                  className="cursor-pointer transition hover:bg-primary/5"
                >
                  <td className="py-3 font-medium text-primary underline-offset-4 group-hover:underline">
                    {u.tag}
                  </td>
                  <td className="py-3">{u.executions.toLocaleString()}</td>
                  <td className="py-3 text-muted-foreground">{u.scriptsUsed}</td>
                  <td className="py-3 text-muted-foreground">{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground">
                    {selected.tag[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display text-lg">{selected.tag}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {selected.discordId}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Executions" value={selected.executions.toLocaleString()} />
                <MiniStat label="Scripts" value={selected.scriptsUsed} />
                <MiniStat label="HWIDs" value={selected.hwids} />
                <MiniStat label="Joined" value={selected.joined} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  Top script: {selected.topScript}
                </Badge>
                <Badge variant="outline" className="border-border">
                  Last active: {selected.lastActive}
                </Badge>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                  Weekly executions
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={selected.weekly}>
                    <CartesianGrid stroke="oklch(0.3 0.04 280 / 0.3)" vertical={false} />
                    <XAxis dataKey="day" stroke="oklch(0.7 0.03 270)" fontSize={11} />
                    <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="execs" name="Executions" fill="oklch(0.62 0.26 295)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base font-semibold">{value}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
