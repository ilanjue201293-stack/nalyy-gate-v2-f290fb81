import { createFileRoute } from "@tanstack/react-router";
import { renderAccessDenied } from "@/lib/server/access-denied";
import { obfuscateLua } from "@/lib/server/access";
import { prisma } from "@/lib/server/prisma";

const db = prisma as typeof prisma & {
  blacklist: {
    findFirst(args: unknown): Promise<{ reason?: string | null } | null>;
  };
  hwidBan: {
    findFirst(args: unknown): Promise<{ reason?: string | null } | null>;
  };
};

export const Route = createFileRoute("/api/loader/$scriptId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const accept = request.headers.get("accept") ?? "";
        if (accept.includes("text/html")) {
          return renderAccessDenied("The loader cannot be viewed directly in a browser.");
        }

        const url = new URL(request.url);
        const keyValue = url.searchParams.get("key");
        const hwid = url.searchParams.get("hwid") ?? undefined;
        const script = await prisma.script.findUnique({ where: { id: params.scriptId } });
        if (!script || script.status !== "active") return renderAccessDenied("Script is not available.");

        if (script.accessMode === "free") {
          if (hwid && (await activeHwidBan(script.id, hwid))) {
            const ban = await activeHwidBan(script.id, hwid);
            return renderAccessDenied(ban?.reason ?? "This HWID is banned for this script.");
          }
          await prisma.execution.create({ data: { scriptId: script.id, hwid, deviceType: "unknown" } });
          return luaResponse(obfuscateLua(script.scriptContent));
        }

        if (!keyValue) return renderAccessDenied("Missing script key.");
        const key = await prisma.key.findUnique({ where: { keyValue }, include: { script: true } });
        if (!key || key.scriptId !== script.id || key.revoked) return renderAccessDenied("Invalid or revoked key.");
        if (key.expiresAt && key.expiresAt < new Date()) return renderAccessDenied("This key is expired.");
        if (!key.redeemedByDiscordId) return renderAccessDenied("Redeem this key in Discord before using the loader.");

        const activeBlock = await db.blacklist.findFirst({
          where: {
            scriptId: key.scriptId,
            active: true,
            OR: [
              { keyValue: key.keyValue },
              key.redeemedByDiscordId ? { discordId: key.redeemedByDiscordId } : { id: "__none__" },
            ],
            AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
          },
        });
        if (activeBlock) return renderAccessDenied(activeBlock.reason ?? "This access is blacklisted.");

        if (hwid) {
          const hwidBan = await activeHwidBan(key.scriptId, hwid);
          if (hwidBan) return renderAccessDenied(hwidBan.reason ?? "This HWID is banned for this script.");
        }

        const whitelist = await prisma.whitelist.findUnique({
          where: {
            scriptId_discordId: {
              scriptId: key.scriptId,
              discordId: key.redeemedByDiscordId,
            },
          },
        });
        if (!whitelist?.active) return renderAccessDenied("This Discord user is not whitelisted.");
        if (whitelist.expiresAt && whitelist.expiresAt < new Date()) return renderAccessDenied("Whitelist access expired.");
        if (key.maxHwids > 0 && whitelist.hwid && hwid && whitelist.hwid !== hwid) {
          return renderAccessDenied("HWID does not match.");
        }
        if (key.maxHwids > 0 && !whitelist.hwid && hwid) {
          await prisma.whitelist.update({ where: { id: whitelist.id }, data: { hwid } });
        }

        await prisma.execution.create({
          data: {
            scriptId: key.scriptId,
            discordId: key.redeemedByDiscordId,
            hwid,
            deviceType: "unknown",
          },
        });

        return luaResponse(obfuscateLua(key.script.scriptContent));
      },
    },
  },
});

async function activeHwidBan(scriptId: string, hwid: string) {
  return db.hwidBan.findFirst({
    where: {
      scriptId,
      hwid,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
}

function luaResponse(code: string) {
  return new Response(code, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
