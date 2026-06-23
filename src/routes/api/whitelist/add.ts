import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { badRequest, forbidden, json, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { getPlan } from "@/lib/plans";

const bodySchema = z.object({
  scriptId: z.string().min(1),
  discordId: z.string().min(1),
  hwid: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const Route = createFileRoute("/api/whitelist/add")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid whitelist payload", parsed.error.flatten());

        const script = await prisma.script.findUnique({ where: { id: parsed.data.scriptId } });
        if (!script) return badRequest("Script does not exist");
        if (!user.isAdmin && script.ownerId !== user.id) return forbidden("You do not own this script");
        const existing = await prisma.whitelist.findUnique({
          where: {
            scriptId_discordId: {
              scriptId: parsed.data.scriptId,
              discordId: parsed.data.discordId,
            },
          },
        });
        if (!existing) {
          const plan = getPlan((user as typeof user & { plan?: string }).plan);
          const currentWhitelist = await prisma.whitelist.count({ where: { script: { ownerId: user.id } } });
          if (currentWhitelist + 1 > plan.limits.whitelist) {
            return badRequest(`Your ${plan.name} plan is limited to ${plan.limits.whitelist} whitelist users.`);
          }
        }

        const row = await prisma.whitelist.upsert({
          where: {
            scriptId_discordId: {
              scriptId: parsed.data.scriptId,
              discordId: parsed.data.discordId,
            },
          },
          create: {
            scriptId: parsed.data.scriptId,
            discordId: parsed.data.discordId,
            hwid: parsed.data.hwid,
            expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
          },
          update: {
            active: true,
            hwid: parsed.data.hwid,
            expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
          },
        });
        return json(row, { status: 201 });
      },
    },
  },
});
