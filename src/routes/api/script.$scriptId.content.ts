import { createFileRoute } from "@tanstack/react-router";
import { badRequest } from "@/lib/server/http";
import { obfuscateLua } from "@/lib/server/access";
import { prisma } from "@/lib/server/prisma";

export const Route = createFileRoute("/api/script/$scriptId/content")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const apiKey = url.searchParams.get("apiKey");
        const discordId = url.searchParams.get("discordId");
        const hwid = url.searchParams.get("hwid");

        const script = await prisma.script.findUnique({ where: { id: params.scriptId } });
        if (!script || script.status !== "active") return badRequest("Script is not available");
        if (apiKey !== script.apiKey) return badRequest("Invalid API key");
        if (script.accessMode === "free") {
          return new Response(script.obfuscate ? obfuscateLua(script.scriptContent) : script.scriptContent, {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        }
        if (!discordId) return badRequest("Discord ID is required");

        const whitelist = await prisma.whitelist.findUnique({
          where: { scriptId_discordId: { scriptId: script.id, discordId } },
        });
        if (!whitelist?.active) return badRequest("User is not whitelisted");
        if (whitelist.expiresAt && whitelist.expiresAt < new Date()) return badRequest("Access expired");
        const key = await prisma.key.findFirst({
          where: {
            scriptId: script.id,
            redeemedByDiscordId: discordId,
            revoked: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { redeemedAt: "desc" },
        });
        if (!key) return badRequest("No active key found");
        if (key.maxHwids > 0 && whitelist.hwid && hwid && whitelist.hwid !== hwid) return badRequest("HWID does not match");

        return new Response(script.obfuscate ? obfuscateLua(script.scriptContent) : script.scriptContent, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
