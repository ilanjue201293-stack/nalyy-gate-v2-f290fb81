import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { normalizeDeviceType } from "@/lib/server/access";
import { badRequest, json, readJson } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({
  scriptId: z.string().min(1),
  discordId: z.string().optional(),
  hwid: z.string().optional(),
  apiKey: z.string().optional(),
  deviceType: z.enum(["pc", "mobile", "unknown"]).optional(),
});

export const Route = createFileRoute("/api/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid verify payload", parsed.error.flatten());

        const script = await prisma.script.findUnique({ where: { id: parsed.data.scriptId } });
        if (!script || script.status !== "active") return badRequest("Script is not available");
        if (parsed.data.apiKey && parsed.data.apiKey !== script.apiKey) return badRequest("Invalid API key");
        if (script.accessMode === "free") {
          await prisma.execution.create({
            data: {
              scriptId: script.id,
              discordId: parsed.data.discordId,
              hwid: parsed.data.hwid,
              deviceType: normalizeDeviceType(parsed.data.deviceType),
            },
          });
          return json({ allowed: true, scriptId: script.id });
        }
        if (!parsed.data.discordId) return badRequest("Discord ID is required");

        const whitelist = await prisma.whitelist.findUnique({
          where: {
            scriptId_discordId: {
              scriptId: script.id,
              discordId: parsed.data.discordId,
            },
          },
        });

        if (!whitelist?.active) return json({ allowed: false, reason: "User is not whitelisted" }, { status: 403 });
        if (whitelist.expiresAt && whitelist.expiresAt < new Date()) {
          return json({ allowed: false, reason: "Access expired" }, { status: 403 });
        }
        const key = await prisma.key.findFirst({
          where: {
            scriptId: script.id,
            redeemedByDiscordId: parsed.data.discordId,
            revoked: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { redeemedAt: "desc" },
        });
        if (!key) return json({ allowed: false, reason: "No active key found" }, { status: 403 });
        if (key.maxHwids > 0 && whitelist.hwid && parsed.data.hwid && whitelist.hwid !== parsed.data.hwid) {
          return json({ allowed: false, reason: "HWID does not match" }, { status: 403 });
        }
        if (key.maxHwids > 0 && !whitelist.hwid && parsed.data.hwid) {
          await prisma.whitelist.update({ where: { id: whitelist.id }, data: { hwid: parsed.data.hwid } });
        }

        await prisma.execution.create({
          data: {
            scriptId: script.id,
            discordId: parsed.data.discordId,
            hwid: parsed.data.hwid,
            deviceType: normalizeDeviceType(parsed.data.deviceType),
          },
        });

        return json({ allowed: true, scriptId: script.id });
      },
    },
  },
});
