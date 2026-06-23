import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload, KeyRound, Sparkles, Gift, TimerReset, Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_app/scripts/add")({
  head: () => ({ meta: [{ title: "Add Script — Nalyy Gate" }] }),
  component: AddScript,
});

function genKey() {
  return (
    "ng_sk_" +
    Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
  );
}

type LicenseMode = "free" | "trial" | "key";

function AddScript() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(genKey());
  const [mode, setMode] = useState<LicenseMode>("key");
  const [trialAmount, setTrialAmount] = useState(24);
  const [trialUnit, setTrialUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [name, setName] = useState("");
  const [discordRoleId, setDiscordRoleId] = useState("");
  const [obfuscate, setObfuscate] = useState(true);
  const [scriptContent, setScriptContent] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      <Link
        to="/scripts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to scripts
      </Link>

      <PageHeader
        title="Add a new script"
        description="Configure your script and ship it to your community."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          apiClient
            .createScript({
              name,
              description: "",
              game: "Script",
              scriptContent,
              apiKey,
              discordRoleId: discordRoleId || undefined,
              hwidLock: false,
              obfuscate,
              status: "active",
              accessMode: mode,
              trialDurationAmount: mode === "trial" ? trialAmount : undefined,
              trialDurationUnit: mode === "trial" ? trialUnit : undefined,
            })
            .then(() => {
              toast.success("Script created");
              navigate({ to: "/scripts" });
            })
            .catch((error) => toast.error(error.message))
            .finally(() => setSaving(false));
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card title="Script details">
            <Field label="Script name" required>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Creator Access Portal" />
            </Field>
            <Field label="Linked Discord role ID">
              <Input value={discordRoleId} onChange={(e) => setDiscordRoleId(e.target.value)} placeholder="Role ID" />
            </Field>
          </Card>

          <Card title="Script file">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/40 p-10 text-center transition hover:border-primary/50 hover:bg-primary/5">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">Drop your .lua / .luau here</div>
              <div className="text-xs text-muted-foreground">or click to browse · max 5MB</div>
              <input
                type="file"
                className="hidden"
                accept=".lua,.luau,.txt"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) setScriptContent(await file.text());
                }}
              />
            </label>
            <Field label="Or paste script content" required>
              <textarea
                required
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-border bg-background/40 p-3 font-mono text-xs outline-none ring-primary/30 focus:ring-2"
                placeholder="Paste the authorized script content here..."
              />
            </Field>
          </Card>

          <Card title="Access mode">
            <div className="grid gap-3 sm:grid-cols-3">
              <ModeCard
                active={mode === "free"}
                onClick={() => setMode("free")}
                icon={Gift}
                title="Free"
                desc="No key required."
              />
              <ModeCard
                active={mode === "trial"}
                onClick={() => setMode("trial")}
                icon={TimerReset}
                title="Trial"
                desc="Temporary access."
              />
              <ModeCard
                active={mode === "key"}
                onClick={() => setMode("key")}
                icon={Lock}
                title="Key system"
                desc="Redeem key required."
              />
            </div>
            {mode === "trial" && (
              <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Trial period
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={trialAmount}
                    onChange={(e) => setTrialAmount(Number(e.target.value))}
                    className="w-28"
                  />
                  <select
                    value={trialUnit}
                    onChange={(e) => setTrialUnit(e.target.value as typeof trialUnit)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="API Key" icon={KeyRound}>
            <p className="text-xs text-muted-foreground">
              This key authenticates your loader. Keep it secret.
            </p>
            <div className="mt-3 break-all rounded-lg border border-primary/30 bg-primary/5 p-3 font-mono text-xs text-primary">
              {apiKey}
            </div>
            <Button
              type="button"
              variant="neon"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setApiKey(genKey())}
            >
              <Sparkles className="h-4 w-4" /> Regenerate
            </Button>
          </Card>
          <Card title="Runtime security">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3 text-sm">
              <span>
                <span className="block font-medium">Obfuscate source</span>
                <span className="block text-[11px] text-muted-foreground">Encode script before serving it.</span>
              </span>
              <button
                type="button"
                onClick={() => setObfuscate((value) => !value)}
                className={`relative h-6 w-11 rounded-full transition ${obfuscate ? "bg-primary" : "bg-muted"}`}
                aria-pressed={obfuscate}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    obfuscate ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </label>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="hero" size="lg" disabled={saving}>
              {saving ? "Creating..." : "Create Script"}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link to="/scripts">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border p-4 text-left transition ${
        active
          ? "border-primary/60 bg-primary/10 shadow-[0_0_24px_-8px_oklch(0.62_0.26_295/0.7)]"
          : "border-border bg-background/40 hover:border-primary/30"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="mt-2 font-display text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}

function Card({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  );
}
