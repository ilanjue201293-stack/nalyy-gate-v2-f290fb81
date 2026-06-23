import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UserPlus, Trash2, ShieldCheck, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { scripts, whitelist } from "@/lib/mock-data";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/whitelist")({
  head: () => ({ meta: [{ title: "Whitelist Manager — Nalyy Gate" }] }),
  component: Whitelist,
});

function Whitelist() {
  const [q, setQ] = useState("");
  const scriptsQuery = useQuery({ queryKey: ["scripts"], queryFn: apiClient.scripts });
  const whitelistQuery = useQuery({ queryKey: ["whitelist"], queryFn: apiClient.whitelist });
  const liveScripts = scriptsQuery.data ?? scripts;
  const liveWhitelist = whitelistQuery.data ?? whitelist;
  const [scriptId, setScriptId] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [hwid, setHwid] = useState("");
  const filtered = liveWhitelist.filter(
    (w) =>
      w.discordTag.toLowerCase().includes(q.toLowerCase()) ||
      w.discordId.includes(q) ||
      w.script.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Whitelist Manager"
        description="Control who can run your scripts. Tied to Discord ID and HWID."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm">
                <UserPlus className="h-4 w-4" /> Add user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Whitelist a user</DialogTitle>
                <DialogDescription>
                  Grant access to a specific Discord user. Optionally bind to a HWID.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  apiClient
                    .addWhitelist({ scriptId: scriptId || liveScripts[0]?.id, discordId, hwid: hwid || undefined })
                    .then(() => {
                      toast.success("User whitelisted");
                      whitelistQuery.refetch();
                    })
                    .catch((error) => toast.error(error.message));
                }}
              >
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Discord ID or tag</Label>
                  <Input required value={discordId} onChange={(e) => setDiscordId(e.target.value)} placeholder="1234567890" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Script</Label>
                  <Select value={scriptId || liveScripts[0]?.id} onValueChange={setScriptId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {liveScripts.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">HWID (optional)</Label>
                  <Input value={hwid} onChange={(e) => setHwid(e.target.value)} placeholder="DEVICE-ID-OPTIONAL" />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="hero">Whitelist user</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatRow label="Whitelisted users" value={liveWhitelist.length} />
        <StatRow label="Active now" value={liveWhitelist.filter((w) => w.status === "online").length} accent />
        <StatRow label="Scripts covered" value={new Set(liveWhitelist.map((w) => w.script)).size} />
      </div>

      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <h3 className="font-display text-base font-semibold">Whitelisted users</h3>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-9 w-56 pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-background/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Script</th>
                <th className="px-4 py-3 font-medium">HWID</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-background/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                        {w.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium">{w.discordTag}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{w.discordId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-border">{w.script}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{w.hwid}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.lastSeen}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        w.status === "online"
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          w.status === "online" ? "bg-success shadow-[0_0_6px_oklch(0.72_0.18_155)]" : "bg-muted-foreground"
                        }`}
                      />
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/15"
                      onClick={() => {
                        apiClient
                          .removeWhitelist({ scriptId: w.scriptId, discordId: w.discordId })
                          .then(() => {
                            toast.success("User removed");
                            whitelistQuery.refetch();
                          })
                          .catch((error) => toast.error(error.message));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

function StatRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl font-bold ${accent ? "text-gradient" : ""}`}>{value}</div>
    </div>
  );
}
