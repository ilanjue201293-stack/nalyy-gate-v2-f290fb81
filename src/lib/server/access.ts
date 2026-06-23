import type { DeviceType, DurationUnit, Prisma, ScriptStatus } from "@prisma/client";
import { prisma } from "./prisma";

export function generateApiKey() {
  return `ng_sk_${randomHex(24)}`;
}

export function generateLicenseKey(prefix = "NALYY") {
  const parts = Array.from({ length: 4 }, () => randomHex(2).toUpperCase());
  return `${prefix}-${parts.join("-")}`;
}

export function calculateExpiry(
  amount?: number | null,
  unit?: DurationUnit | null,
  from = new Date(),
) {
  if (!amount || !unit) return null;
  const multipliers: Record<DurationUnit, number> = {
    minutes: 60_000,
    hours: 3_600_000,
    days: 86_400_000,
    weeks: 604_800_000,
    months: 2_592_000_000,
  };
  return new Date(from.getTime() + amount * multipliers[unit]);
}

export async function scriptSummaryWhere(ownerId?: string) {
  const where: Prisma.ScriptWhereInput = ownerId ? { ownerId } : {};
  const scripts = await prisma.script.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { keys: true, whitelist: true, executions: true },
      },
    },
  });

  return scripts.map((script) => ({
    id: script.id,
    ownerId: script.ownerId,
    name: script.name,
    description: script.description,
    game: script.game,
    scriptContent: script.scriptContent,
    apiKey: script.apiKey,
    discordGuildId: script.discordGuildId,
    discordRoleId: script.discordRoleId,
    discordRole: script.discordRoleId ?? "Not configured",
    hwidLock: script.hwidLock,
    obfuscate: script.obfuscate,
    accessMode: script.accessMode,
    trialDurationAmount: script.trialDurationAmount,
    trialDurationUnit: script.trialDurationUnit,
    status: script.status,
    users: script._count.whitelist,
    keys: script._count.keys,
    executions: script._count.executions,
    createdAt: script.createdAt.toISOString().slice(0, 10),
    updatedAt: script.updatedAt.toISOString(),
  }));
}

export async function keySummaryWhere(ownerId?: string) {
  const keys = await prisma.key.findMany({
    where: ownerId ? { script: { ownerId } } : {},
    include: { script: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return keys.map((key) => {
    const expired = !!key.expiresAt && key.expiresAt < now;
    const status = key.revoked
      ? "revoked"
      : expired
        ? "expired"
        : key.redeemed
          ? "active"
          : "unused";

    return {
      id: key.id,
      key: key.keyValue,
      keyValue: key.keyValue,
      scriptId: key.scriptId,
      scriptName: key.script.name,
      user: key.redeemedByDiscordId,
      duration: key.lifetime
        ? "Lifetime"
        : key.durationAmount && key.durationUnit
          ? `${key.durationAmount} ${key.durationUnit}`
          : "Custom",
      durationAmount: key.durationAmount,
      durationUnit: key.durationUnit,
      lifetime: key.lifetime,
      oneTime: key.oneTime,
      maxHwids: key.maxHwids,
      redeemed: key.redeemed,
      expiresAt: key.lifetime ? "Never" : key.expiresAt?.toISOString().slice(0, 10) ?? "-",
      note: key.note ?? "",
      revoked: key.revoked,
      status,
      createdAt: key.createdAt.toISOString().slice(0, 10),
    };
  });
}

export async function whitelistSummaryWhere(ownerId?: string) {
  const rows = await prisma.whitelist.findMany({
    where: ownerId ? { script: { ownerId } } : {},
    include: { script: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    scriptId: row.scriptId,
    discordId: row.discordId,
    discordTag: row.discordId,
    avatar: row.discordId.slice(0, 1).toUpperCase(),
    script: row.script.name,
    hwid: row.hwid ?? "-",
    addedAt: row.createdAt.toISOString().slice(0, 10),
    lastSeen: "unknown",
    status: row.active ? "online" : "offline",
    active: row.active,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  }));
}

export function normalizeStatus(status: unknown): ScriptStatus {
  if (status === "active" || status === "paused" || status === "draft") return status;
  return "draft";
}

export function normalizeDeviceType(deviceType: unknown): DeviceType {
  if (deviceType === "pc" || deviceType === "mobile") return deviceType;
  return "unknown";
}

type ObfuscationLevel = "medium" | "strong";

export function obfuscateLua(source: string, _level: ObfuscationLevel = "medium") {
  const key = randomByte(25, 230);
  const shift = randomByte(3, 47);
  const bytes = Array.from(Buffer.from(source, "utf8"));
  const encoded = bytes.map((byte, index) => (byte + key + ((index + 1) * shift)) % 256);
  const names = Array.from({ length: 13 }, () => randomLuaName());
  const [
    dataName,
    keyName,
    shiftName,
    outName,
    charName,
    envName,
    resolveName,
    joinName,
    runName,
    textName,
    fnName,
    seqName,
    nameName,
  ] = names;

  return `do
  local ${dataName}={${encoded.join(",")}}
  local ${keyName}=${key}
  local ${shiftName}=${shift}
  local ${outName}={}
  local ${charName}=string.char
  local ${envName}=(getgenv and getgenv()) or (getfenv and getfenv(0)) or _G
  local function ${resolveName}(root, ${seqName})
    local ${nameName}=""
    for i=1,#${seqName} do
      ${nameName}=${nameName}..${charName}(${seqName}[i])
    end
    return (root and root[${nameName}]) or (_G and _G[${nameName}])
  end
  for i=1,#${dataName} do
    ${outName}[i]=${charName}((${dataName}[i]-${keyName}-(i*${shiftName}))%256)
  end
  local ${joinName}=${resolveName}(${resolveName}(${envName},{116,97,98,108,101}),{99,111,110,99,97,116})
  local ${runName}=${resolveName}(${envName},{108,111,97,100,115,116,114,105,110,103})
  local ${textName}=${joinName}(${outName})
  local ${fnName}=${runName}(${textName})
  if ${fnName} then
    return ${fnName}()
  end
end`;
}

function randomLuaName() {
  return `_${randomHex(5)}`;
}

function randomByte(min: number, max: number) {
  return min + (secureRandomByte() % (max - min + 1));
}

function randomHex(bytes: number) {
  return Array.from({ length: bytes }, () => secureRandomByte().toString(16).padStart(2, "0")).join("");
}

function secureRandomByte() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint8Array(1))[0];
  }
  return Math.floor(Math.random() * 256);
}
