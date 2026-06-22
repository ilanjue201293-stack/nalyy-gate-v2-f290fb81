import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Copy, Trash2, Plus, Infinity as InfinityIcon, UserLock, Shield, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KeyStatus } from "./_app.dashboard";
import { scripts, keys } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/keys")({
  head: () => ({ meta: [{ title: "Key Manager — Nalyy Gate" }] }),
  component: KeyManager,
});

function KeyManager() {
  const [filterStatus, setFilterStatus] = useState("all");
  const filtered = keys.filter((k) => filterStatus === "all" || k.status === filterStatus);

  const [lifetime, setLifetime] = useState(false);
  const [durationAmount, setDurationAmount] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days">("days");

  const [hwidLock, setHwidLock] = useState(true);
  const [hwidCount, setHwidCount] = useState(1);

  const [oneTime, setOneTime] = useState(false);
  const [redeemLock, setRedeemLock] = useState(false);
  const [discordId, setDiscordId] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Key Manager"
        description="Generate and track access keys for every script you ship."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Create keys</h3>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Keys generated (demo)");
            }}
          >
            <Field label="Script">
              <Select defaultValue={scripts[0].id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {scripts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Quantity">
              <Input type="number" min={1} max={500} defaultValue={1} disabled={redeemLock || oneTime} />
              {(redeemLock || oneTime) && (
                <p className="text-[10px] text-muted-foreground">
                  Quantity locked to 1 with current options.
                </p>
              )}
            </Field>

            {/* Duration */}
            <ToggleRow
              icon={InfinityIcon}
              title="Lifetime key"
              desc="Never expires."
              checked={lifetime}
              onChange={setLifetime}
            />
            {!lifetime && (
              <Field label="Duration">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={durationAmount}
                    onChange={(e) => setDurationAmount(Number(e.target.value))}
                  />
                  <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as typeof durationUnit)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Field>
            )}

            {/* HWID */}
            <ToggleRow
              icon={Shield}
              title="HWID lock"
              desc="Bind the key to hardware IDs."
              checked={hwidLock}
              onChange={setHwidLock}
            />
            {hwidLock && (
              <Field label="Allowed HWIDs">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={hwidCount}
                  onChange={(e) => setHwidCount(Number(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground">
                  Number of distinct devices that may use this key.
                </p>
              </Field>
            )}

            {/* One time */}
            <ToggleRow
              icon={Zap}
              title="One-time key"
              desc="Expires immediately after first use."
              checked={oneTime}
              onChange={setOneTime}
            />

            {/* Discord lock */}
            <ToggleRow
              icon={UserLock}
              title="Lock to Discord user"
              desc="Only this user can redeem the key."
              checked={redeemLock}
              onChange={setRedeemLock}
            />
            {redeemLock && (
              <Field label="Discord ID">
                <Input
                  placeholder="e.g. 928374651029384756"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                />
              </Field>
            )}

            <Field label="Internal note">
              <Textarea rows={2} placeholder="e.g. Discord giveaway batch #4" />
            </Field>
            <Button type="submit" variant="hero" className="w-full">
              <Plus className="h-4 w-4" /> Generate
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div>
              <h3 className="font-display text-base font-semibold">All keys</h3>
              <p className="text-xs text-muted-foreground">{filtered.length} keys</p>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-background/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Script</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((k) => (
                  <tr key={k.id} className="hover:bg-background/30">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs">{k.key}</div>
                      {k.note && (
                        <div className="mt-1 text-[10px] text-muted-foreground">{k.note}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-border">{k.scriptName}</Badge>
                    </td>
                    <td className="px-4 py-3">{k.user ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{k.expiresAt}</td>
                    <td className="px-4 py-3"><KeyStatus status={k.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(k.key);
                            toast.success("Key copied");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/15">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex min-w-0 gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${checked ? "text-primary" : "text-muted-foreground"}`} />
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[11px] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}
