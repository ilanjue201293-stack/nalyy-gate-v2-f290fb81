import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Bot, Palette, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { getPlan } from "@/lib/plans";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings - Nalyy Gate" }] }),
  component: Settings,
});

function Settings() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.me().catch(() => ({ user: null })),
    retry: false,
    enabled: typeof window !== "undefined",
  });
  const user = meQuery.data?.user;
  const plan = getPlan(user?.plan);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setEmail(user.email ?? "");
    setAvatar(user.avatar ?? "");
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.updateProfile({ username, email, avatar });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, Discord and dashboard preferences." />

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account"><User className="mr-1.5 h-3.5 w-3.5" /> Account</TabsTrigger>
          <TabsTrigger value="discord"><Bot className="mr-1.5 h-3.5 w-3.5" /> Discord</TabsTrigger>
          <TabsTrigger value="dashboard"><Palette className="mr-1.5 h-3.5 w-3.5" /> Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <SettingsCard title="Account profile" description="Update your public profile and contact details.">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/30 bg-primary/10">
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-xl font-bold text-primary">{username.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <Field label="Display name"><Input value={username} onChange={(event) => setUsername(event.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
              </div>
            </div>
            <Field label="Profile photo URL">
              <Input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://..." />
            </Field>
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Current plan</div>
              <div className="mt-1 font-display text-lg font-semibold text-primary">{plan.name}</div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="discord" className="mt-6">
          <SettingsCard title="Discord integration" description="Your Discord OAuth identity used by Nalyy Gate.">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#5865F2]/15 text-[#5865F2]">
                  {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <Bot className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Connected as {user?.username ?? "Discord user"}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{user?.discordId ?? "-"}</div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href="/api/auth/discord">Reconnect</a>
              </Button>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <SettingsCard title="Dashboard preferences" description="Local display preferences for this browser.">
            <Toggle label="Compact tables" desc="Show more rows by reducing padding." />
            <Toggle label="Animated background" desc="Enable the ambient glow on hero sections." defaultChecked />
            <Toggle label="Notifications" desc="Show dashboard toasts when actions finish." defaultChecked />
          </SettingsCard>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="hero" onClick={saveProfile} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
      <div className="mb-5">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
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

function Toggle({
  label,
  desc,
  defaultChecked,
}: {
  label: string;
  desc?: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background/40 p-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="mt-1 text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch checked={on} onCheckedChange={setOn} className="shrink-0" />
    </div>
  );
}
