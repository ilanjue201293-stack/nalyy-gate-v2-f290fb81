import type { Script, ScriptKey, WhitelistUser } from "./mock-data";
import type { PlanId } from "./plans";

export type GlobalStats = {
  totals: {
    scripts: number;
    activeScripts: number;
    keys: number;
    activeKeys: number;
    whitelistUsers: number;
    onlineUsers: number;
    executions: number;
  };
  executionsByDay: { day: string; execs: number; keys: number }[];
  accessModes?: { free: number; trial: number; key: number; activeTrials: number };
  topUsers?: {
    tag: string;
    discordId: string;
    executions: number;
    scriptsUsed: number;
    lastActive: string;
    joined: string;
    hwids: number;
    topScript: string;
    weekly: { day: string; execs: number }[];
  }[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? response.statusText);
  }
  return (await response.json()) as T;
}

export const apiClient = {
  me: () => api<{ user: { id: string; username: string; discordId: string; avatar?: string | null; email?: string | null; plan?: PlanId; isAdmin: boolean } }>("/api/auth/me"),
  updateProfile: (data: unknown) =>
    api<{ user: { id: string; username: string; discordId: string; avatar?: string | null; email?: string | null; plan?: PlanId; isAdmin: boolean } }>("/api/account/profile", { method: "PATCH", body: JSON.stringify(data) }),
  selectPlan: (plan: PlanId) =>
    api<{ plan: PlanId }>("/api/billing/select-plan", { method: "POST", body: JSON.stringify({ plan }) }),
  scripts: () => api<Script[]>("/api/scripts"),
  script: (id: string) => api<{ script: Script; keys: ScriptKey[]; whitelist: WhitelistUser[] }>(`/api/scripts/${id}`),
  obfuscatePreview: (id: string) => api<{ code: string; generatedAt: string }>(`/api/scripts/${id}/obfuscate-preview`),
  createScript: (data: unknown) =>
    api<Script>("/api/scripts/create", { method: "POST", body: JSON.stringify(data) }),
  updateScript: (id: string, data: unknown) =>
    api<Script>(`/api/scripts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteScript: (id: string) => api<{ ok: true }>(`/api/scripts/${id}`, { method: "DELETE" }),
  keys: () => api<ScriptKey[]>("/api/keys"),
  createKeys: (data: unknown) =>
    api<{ keys: ScriptKey[] }>("/api/keys/create", { method: "POST", body: JSON.stringify(data) }),
  deleteKey: (id: string) => api<{ ok: true }>(`/api/keys/${id}`, { method: "DELETE" }),
  revokeKey: (id: string) => api<ScriptKey>(`/api/keys/${id}/revoke`, { method: "POST" }),
  whitelist: () => api<WhitelistUser[]>("/api/whitelist"),
  addWhitelist: (data: unknown) =>
    api<WhitelistUser>("/api/whitelist/add", { method: "POST", body: JSON.stringify(data) }),
  removeWhitelist: (data: unknown) =>
    api<{ ok: true }>("/api/whitelist/remove", { method: "POST", body: JSON.stringify(data) }),
  resetHwid: (data: unknown) =>
    api<{ ok: true }>("/api/hwid/reset", { method: "POST", body: JSON.stringify(data) }),
  globalStats: () => api<GlobalStats>("/api/stats/global"),
};

export function useAsyncData<T>(loader: () => Promise<T>, fallback: T) {
  return { loader, fallback };
}
