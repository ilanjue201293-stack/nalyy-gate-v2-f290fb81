import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PlusCircle, Search, FileCode2, Users, KeyRound, Activity } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScriptStatus } from "./_app.dashboard";
import { scripts } from "@/lib/mock-data";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/scripts/")({
  head: () => ({ meta: [{ title: "My Scripts — Nalyy Gate" }] }),
  component: ScriptsList,
});

function ScriptsList() {
  const [q, setQ] = useState("");
  const scriptsQuery = useQuery({ queryKey: ["scripts"], queryFn: apiClient.scripts });
  const liveScripts = scriptsQuery.data ?? scripts;
  const filtered = useMemo(
    () => liveScripts.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())),
    [liveScripts, q],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Scripts"
        description="All your scripts in one place."
        actions={
          <Button asChild variant="hero" size="sm">
            <Link to="/scripts/add">
              <PlusCircle className="h-4 w-4" /> New Script
            </Link>
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          className="h-10 border-border/60 bg-card/50 pl-9 backdrop-blur"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-16 text-center">
          <p className="text-muted-foreground">No script matches your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to="/scripts/$id"
              params={{ id: s.id }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_oklch(0.62_0.26_295/0.7)]"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/25" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <FileCode2 className="h-5 w-5" />
                  </div>
                  <ScriptStatus status={s.status} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/50 pt-4 text-center">
                  <Stat icon={Users} value={s.users} label="Users" />
                  <Stat icon={KeyRound} value={s.keys} label="Keys" />
                  <Stat icon={Activity} value={s.executions} label="Execs" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  const formatted =
    value >= 1000 ? (value / 1000).toFixed(1).replace(/\.0$/, "") + "k" : value.toString();
  return (
    <div>
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <div className="mt-1 font-display text-sm font-semibold">{formatted}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
