import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  KeyRound,
  Users,
  Activity,
  Eye,
  EyeOff,
  Trash2,
  FileCode2,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScriptStatus } from "./_app.dashboard";
import { scripts, keys, whitelist } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/scripts/$id")({
  head: ({ params }) => {
    const s = scripts.find((x) => x.id === params.id);
    return { meta: [{ title: `${s?.name ?? "Script"} — Nalyy Gate` }] };
  },
  loader: ({ params }) => {
    const s = scripts.find((x) => x.id === params.id);
    if (!s) throw notFound();
    return { script: s };
  },
  notFoundComponent: () => (
    <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
      Script not found.
    </div>
  ),
  component: ScriptDetails,
});

function ScriptDetails() {
  const { script } = Route.useLoaderData();
  const [reveal, setReveal] = useState(false);
  const scriptKeys = keys.filter((k) => k.scriptId === script.id);
  const scriptWhitelist = whitelist.filter((w) => w.script === script.name);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Link
        to="/scripts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to scripts
      </Link>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <FileCode2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{script.name}</h1>
              <ScriptStatus status={script.status} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Users" value={script.users} icon={Users} accent="primary" />
        <StatCard label="Keys" value={script.keys} icon={KeyRound} accent="accent" />
        <StatCard label="Executions" value={script.executions.toLocaleString()} icon={Activity} accent="success" />
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold">API Key</h3>
            <p className="text-xs text-muted-foreground">Used by your loader to authenticate.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setReveal((r) => !r)}>
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {reveal ? "Hide" : "Reveal"}
            </Button>
            <Button variant="neon" size="sm" onClick={() => copy(script.apiKey)}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
        </div>
        <div className="mt-4 break-all rounded-xl border border-primary/30 bg-primary/5 p-4 font-mono text-sm text-primary">
          {reveal ? script.apiKey : "•".repeat(script.apiKey.length)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="border-border">
            Role: {script.discordRole}
          </Badge>
          <Badge variant="outline" className="border-border">
            Created: {script.createdAt}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">Keys ({scriptKeys.length})</TabsTrigger>
          <TabsTrigger value="users">Whitelist ({scriptWhitelist.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="keys" className="mt-4">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card/50 backdrop-blur">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-background/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {scriptKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      No keys yet for this script.
                    </td>
                  </tr>
                ) : (
                  scriptKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="px-4 py-3 font-mono text-xs">{k.key}</td>
                      <td className="px-4 py-3">{k.user ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{k.duration}</td>
                      <td className="px-4 py-3 text-muted-foreground">{k.expiresAt}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{k.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card/50 backdrop-blur">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-background/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Discord</th>
                  <th className="px-4 py-3 font-medium">HWID</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {scriptWhitelist.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-muted-foreground">
                      No whitelisted users for this script.
                    </td>
                  </tr>
                ) : (
                  scriptWhitelist.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3">{w.discordTag}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{w.hwid}</td>
                      <td className="px-4 py-3 text-muted-foreground">{w.addedAt}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            w.status === "online"
                              ? "border-success/40 text-success"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {w.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
