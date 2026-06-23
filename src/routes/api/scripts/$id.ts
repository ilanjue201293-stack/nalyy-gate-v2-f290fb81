import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateApiKey, keySummaryWhere, normalizeStatus, scriptSummaryWhere, whitelistSummaryWhere } from "@/lib/server/access";
import { badRequest, forbidden, json, notFound, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  game: z.string().min(1).optional(),
  scriptContent: z.string().min(1).optional(),
  apiKey: z.string().optional(),
  regenerateApiKey: z.boolean().optional(),
  discordGuildId: z.string().nullable().optional(),
  discordRoleId: z.string().nullable().optional(),
  hwidLock: z.boolean().optional(),
  obfuscate: z.boolean().optional(),
  accessMode: z.enum(["free", "trial", "key"]).optional(),
  trialDurationAmount: z.number().int().positive().nullable().optional(),
  trialDurationUnit: z.enum(["minutes", "hours", "days", "weeks", "months"]).nullable().optional(),
  status: z.string().optional(),
});

async function ownedScript(id: string, userId: string, isAdmin: boolean) {
  const script = await prisma.script.findUnique({ where: { id } });
  if (!script) return null;
  if (!isAdmin && script.ownerId !== userId) throw forbidden("You do not own this script");
  return script;
}

export const Route = createFileRoute("/api/scripts/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await requireUser(request);
        const script = await ownedScript(params.id, user.id, user.isAdmin);
        if (!script) return notFound("Script not found");

        const [summary] = (await scriptSummaryWhere(user.isAdmin ? undefined : user.id)).filter(
          (item) => item.id === params.id,
        );
        const keys = (await keySummaryWhere(user.isAdmin ? undefined : user.id)).filter(
          (item) => item.scriptId === params.id,
        );
        const whitelist = (await whitelistSummaryWhere(user.isAdmin ? undefined : user.id)).filter(
          (item) => item.scriptId === params.id,
        );
        return json({ script: summary, keys, whitelist });
      },
      PATCH: async ({ request, params }) => {
        const user = await requireUser(request);
        const script = await ownedScript(params.id, user.id, user.isAdmin);
        if (!script) return notFound("Script not found");

        const parsed = patchSchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid script update", parsed.error.flatten());

        const { regenerateApiKey, status, ...data } = parsed.data;
        const updated = await prisma.script.update({
          where: { id: params.id },
          data: {
            ...data,
            status: status ? normalizeStatus(status) : undefined,
            apiKey: regenerateApiKey ? generateApiKey() : data.apiKey,
          },
        });
        return json(updated);
      },
      DELETE: async ({ request, params }) => {
        const user = await requireUser(request);
        const script = await ownedScript(params.id, user.id, user.isAdmin);
        if (!script) return notFound("Script not found");
        await prisma.script.delete({ where: { id: params.id } });
        return json({ ok: true });
      },
    },
  },
});
