export type Script = {
  id: string;
  ownerId?: string;
  name: string;
  description: string;
  game: string;
  scriptContent?: string;
  apiKey: string;
  discordGuildId?: string | null;
  discordRoleId?: string | null;
  discordRole: string;
  hwidLock: boolean;
  obfuscate?: boolean;
  accessMode?: "free" | "trial" | "key";
  trialDurationAmount?: number | null;
  trialDurationUnit?: string | null;
  status: "active" | "paused" | "draft";
  users: number;
  keys: number;
  executions: number;
  createdAt: string;
};

export type ScriptKey = {
  id: string;
  key: string;
  keyValue?: string;
  scriptId: string;
  scriptName: string;
  user: string | null;
  duration: string;
  durationAmount?: number | null;
  durationUnit?: string | null;
  lifetime?: boolean;
  oneTime?: boolean;
  maxHwids?: number;
  redeemed?: boolean;
  status: "active" | "expired" | "revoked" | "unused";
  expiresAt: string;
  note: string;
  createdAt: string;
};

export type WhitelistUser = {
  id: string;
  scriptId?: string;
  discordId: string;
  discordTag: string;
  avatar: string;
  script: string;
  hwid: string;
  addedAt: string;
  lastSeen: string;
  status: "online" | "offline";
  active?: boolean;
};

export const scripts: Script[] = [];

export const keys: ScriptKey[] = [];

export const whitelist: WhitelistUser[] = [];

export const executionsByDay = [
  { day: "Mon", execs: 0, keys: 0 },
  { day: "Tue", execs: 0, keys: 0 },
  { day: "Wed", execs: 0, keys: 0 },
  { day: "Thu", execs: 0, keys: 0 },
  { day: "Fri", execs: 0, keys: 0 },
  { day: "Sat", execs: 0, keys: 0 },
  { day: "Sun", execs: 0, keys: 0 },
];

export const scriptShare = scripts
  .filter((s) => s.executions > 0)
  .map((s) => ({ name: s.name, value: s.executions }));

export const totals = {
  scripts: scripts.length,
  activeScripts: scripts.filter((s) => s.status === "active").length,
  keys: keys.length,
  activeKeys: keys.filter((k) => k.status === "active").length,
  whitelistUsers: whitelist.length,
  onlineUsers: whitelist.filter((w) => w.status === "online").length,
  executions: scripts.reduce((a, b) => a + b.executions, 0),
};

export const games = [
  "Community Experience",
  "Training Place",
  "Creator Utility",
  "Private QA Place",
  "Other",
];
