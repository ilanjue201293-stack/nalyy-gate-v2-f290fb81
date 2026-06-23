import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { badRequest, json, readJson } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({
  keyValue: z.string().min(1),
  discordId: z.string().min(1),
  hwid: z.string().optional(),
});

export const Route = createFileRoute("/api/redeem")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid redeem payload", parsed.error.flatten());

        const key = await prisma.key.findUnique({ where: { keyValue: parsed.data.keyValue }, include: { script: true } });
        if (!key || key.revoked) return badRequest("Key is invalid or revoked");
        if (key.expiresAt && key.expiresAt < new Date()) return badRequest("Key is expired");
        if (key.redeemed && key.oneTime) return badRequest("Key was already redeemed");
        if (key.redeemedByDiscordId && key.redeemedByDiscordId !== parsed.data.discordId) {
          return badRequest("Key is assigned to another Discord user");
        }

        const redeemedAt = new Date();
        await prisma.$transaction([
          prisma.key.update({
            where: { id: key.id },
            data: {
              redeemed: true,
              redeemedByDiscordId: parsed.data.discordId,
              redeemedAt,
            },
          }),
          prisma.whitelist.upsert({
            where: {
              scriptId_discordId: {
                scriptId: key.scriptId,
                discordId: parsed.data.discordId,
              },
            },
            create: {
              scriptId: key.scriptId,
              discordId: parsed.data.discordId,
              hwid: parsed.data.hwid,
              active: true,
              expiresAt: key.expiresAt,
            },
            update: {
              active: true,
              hwid: parsed.data.hwid,
              expiresAt: key.expiresAt,
            },
          }),
        ]);

        return json({ ok: true, scriptId: key.scriptId, expiresAt: key.expiresAt });
      },
    },
  },
});
