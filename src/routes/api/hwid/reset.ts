import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { badRequest, forbidden, json, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({
  scriptId: z.string().min(1),
  discordId: z.string().min(1),
});

export const Route = createFileRoute("/api/hwid/reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid HWID reset payload", parsed.error.flatten());

        const row = await prisma.whitelist.findUnique({
          where: {
            scriptId_discordId: {
              scriptId: parsed.data.scriptId,
              discordId: parsed.data.discordId,
            },
          },
          include: { script: true },
        });
        if (!row) return badRequest("Whitelist entry does not exist");
        if (!user.isAdmin && row.script.ownerId !== user.id) return forbidden("You do not own this script");

        await prisma.whitelist.update({ where: { id: row.id }, data: { hwid: null } });
        return json({ ok: true });
      },
    },
  },
});
