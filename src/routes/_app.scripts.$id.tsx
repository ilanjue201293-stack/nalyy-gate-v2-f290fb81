import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  RefreshCw,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScriptStatus } from "./_app.dashboard";
import { scripts, keys, whitelist } from "@/lib/mock-data";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/scripts/$id")({
  head: () => ({ meta: [{ title: "Script - Nalyy Gate" }] }),
  notFoundComponent: () => (
    <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
      Script not found.
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
      Something went wrong loading this script.
    </div>
  ),
  component: ScriptDetails,
});

function ScriptDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const detailQuery = useQuery({ queryKey: ["scripts", id], queryFn: () => apiClient.script(id) });
  const fallbackScript = scripts.find((x) => x.id === id) ?? scripts[0];
  const script = detailQuery.data?.script ?? fallbackScript;
  const obfuscationQuery = useQuery({
    queryKey: ["scripts", id, "obfuscate-preview"],
    queryFn: () => apiClient.obfuscatePreview(id),
    enabled: !!script?.obfuscate,
    staleTime: 0,
  });
  const [reveal, setReveal] = useState(false);
  const scriptKeys = detailQuery.data?.keys ?? keys.filter((k) => k.scriptId === script.id);
  const scriptWhitelist =
    detailQuery.data?.whitelist ?? whitelist.filter((w) => w.script === script.name);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editMode, setEditMode] = useState<"free" | "trial" | "key">("key");
  const [editTrialAmount, setEditTrialAmount] = useState(24);
  const [editTrialUnit, setEditTrialUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [editObfuscate, setEditObfuscate] = useState(true);
  const [editStatus, setEditStatus] = useState<"active" | "paused" | "draft">("active");

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied to clipboard");
  };

  if (detailQuery.isLoading && !script) {
    return <div className="p-10 text-center text-muted-foreground">Loading script...</div>;
  }

  if (!script) {
    return <div className="p-10 text-center text-muted-foreground">Script not found.</div>;
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditName(script.name);
              setEditRoleId(script.discordRoleId ?? "");
              setEditMode(script.accessMode ?? "key");
              setEditTrialAmount(script.trialDurationAmount ?? 24);
              setEditTrialUnit((script.trialDurationUnit as "minutes" | "hours" | "days") ?? "hours");
              setEditObfuscate(script.obfuscate ?? true);
              setEditStatus(script.status);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              apiClient
                .deleteScript(script.id)
                .then(() => {
                  toast.success("Script deleted");
                  navigate({ to: "/scripts" });
                })
                .catch((error) => toast.error(error.message));
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit script</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              apiClient
                .updateScript(script.id, {
                  name: editName,
                  discordRoleId: editRoleId || null,
                  accessMode: editMode,
                  trialDurationAmount: editMode === "trial" ? editTrialAmount : null,
                  trialDurationUnit: editMode === "trial" ? editTrialUnit : null,
                  hwidLock: false,
                  obfuscate: editObfuscate,
                  status: editStatus,
                })
                .then(() => {
                  toast.success("Script updated");
                  setEditOpen(false);
                  detailQuery.refetch();
                })
                .catch((error) => toast.error(error.message));
            }}
          >
            <div className="space-y-2">
              <Label>Script name</Label>
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Discord role ID</Label>
              <Input value={editRoleId} onChange={(event) => setEditRoleId(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Access mode</Label>
                <select
                  value={editMode}
                  onChange={(event) => setEditMode(event.target.value as typeof editMode)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="free">Free</option>
                  <option value="trial">Trial</option>
                  <option value="key">Key system</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value as typeof editStatus)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            {editMode === "trial" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Trial duration</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editTrialAmount}
                    onChange={(event) => setEditTrialAmount(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <select
                    value={editTrialUnit}
                    onChange={(event) => setEditTrialUnit(event.target.value as typeof editTrialUnit)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}
            <label className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3 text-sm">
              <span>
                <span className="block font-medium">Obfuscate source</span>
                <span className="block text-[11px] text-muted-foreground">Encode script before serving it.</span>
              </span>
              <button
                type="button"
                onClick={() => setEditObfuscate((value) => !value)}
                className={`relative h-6 w-11 rounded-full transition ${editObfuscate ? "bg-primary" : "bg-muted"}`}
                aria-pressed={editObfuscate}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    editObfuscate ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </label>
            <DialogFooter>
              <Button type="submit" variant="hero">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
          {reveal ? script.apiKey : "*".repeat(script.apiKey.length)}
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

      <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold">Script source</h3>
            <p className="text-xs text-muted-foreground">
              View the stored source and the obfuscated output served by the loader.
            </p>
          </div>
          <Badge variant="outline" className="border-border">
            {script.obfuscate ? "Obfuscation enabled" : "Raw source"}
          </Badge>
        </div>
        <Tabs defaultValue="source">
          <TabsList>
            <TabsTrigger value="source">Source code</TabsTrigger>
            {script.obfuscate && <TabsTrigger value="obfuscated">Obfuscated code</TabsTrigger>}
          </TabsList>
          <TabsContent value="source" className="mt-4">
            <textarea
              readOnly
              value={script.scriptContent ?? ""}
              rows={12}
              className="w-full resize-y rounded-xl border border-border bg-background/40 p-3 font-mono text-xs outline-none"
            />
          </TabsContent>
          {script.obfuscate && (
            <TabsContent value="obfuscated" className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Real server output. It changes every time you regenerate it.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => obfuscationQuery.refetch()}
                  disabled={obfuscationQuery.isFetching}
                >
                  <RefreshCw className={`h-4 w-4 ${obfuscationQuery.isFetching ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
              <textarea
                readOnly
                value={obfuscationQuery.data?.code ?? (obfuscationQuery.isLoading ? "Generating obfuscated preview..." : "")}
                rows={12}
                className="w-full resize-y rounded-xl border border-border bg-background/40 p-3 font-mono text-xs outline-none"
              />
            </TabsContent>
          )}
        </Tabs>
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
                      <td className="px-4 py-3">{k.user ?? "-"}</td>
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
