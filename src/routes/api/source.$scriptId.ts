import { createFileRoute } from "@tanstack/react-router";
import { renderAccessDenied } from "@/lib/server/access-denied";
import { prepareRuntimeSource } from "@/lib/server/access";
import { prisma } from "@/lib/server/prisma";

const db = prisma as typeof prisma & {
  blacklist: {
    findFirst(args: unknown): Promise<{ reason?: string | null } | null>;
  };
  hwidBan: {
    findFirst(args: unknown): Promise<{ reason?: string | null } | null>;
  };
};

export const Route = createFileRoute("/api/source/$scriptId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const accept = request.headers.get("accept") ?? "";
        if (accept.includes("text/html")) {
          return renderAccessDenied("Raw source cannot be viewed directly in a browser.");
        }
        const url = new URL(request.url);
        const keyValue = url.searchParams.get("key");
        const hwid = url.searchParams.get("hwid") ?? undefined;

        const script = await prisma.script.findUnique({ where: { id: params.scriptId } });
        if (!script || script.status !== "active") return renderAccessDenied("Script is not available.");

        if (script.accessMode === "free") {
          if (hwid) {
            const hwidBan = await db.hwidBan.findFirst({
              where: {
                scriptId: script.id,
                hwid,
                active: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            });
            if (hwidBan) return renderAccessDenied(hwidBan.reason ?? "This HWID is banned for this script.");
          }
          await prisma.execution.create({ data: { scriptId: script.id, hwid, deviceType: "unknown" } });
          return luaResponse(prepareRuntimeSource(script.scriptContent, script.obfuscate));
        }

        if (!keyValue) return renderAccessDenied("Missing script key.");
        const key = await prisma.key.findUnique({ where: { keyValue }, include: { script: true } });
        if (!key || key.scriptId !== params.scriptId || key.revoked) return renderAccessDenied("Invalid or revoked key.");
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
          const hwidBan = await db.hwidBan.findFirst({
            where: {
              scriptId: key.scriptId,
              hwid,
              active: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          });
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
        if (key.maxHwids > 0 && whitelist.hwid && hwid && whitelist.hwid !== hwid) return renderAccessDenied("HWID does not match.");
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

        return luaResponse(prepareRuntimeSource(key.script.scriptContent, key.script.obfuscate));
      },
    },
  },
});

function luaResponse(code: string) {
  return new Response(code, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
