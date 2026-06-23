import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateApiKey, normalizeStatus } from "@/lib/server/access";
import { badRequest, json, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { getPlan } from "@/lib/plans";

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  game: z.string().min(1),
  scriptContent: z.string().min(1),
  apiKey: z.string().optional(),
  discordGuildId: z.string().optional(),
  discordRoleId: z.string().optional(),
  hwidLock: z.boolean().default(true),
  obfuscate: z.boolean().default(false),
  accessMode: z.enum(["free", "trial", "key"]).default("key"),
  trialDurationAmount: z.number().int().positive().optional(),
  trialDurationUnit: z.enum(["minutes", "hours", "days", "weeks", "months"]).optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/api/scripts/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid script payload", parsed.error.flatten());
        const plan = getPlan((user as typeof user & { plan?: string }).plan);
        const scriptCount = await prisma.script.count({ where: { ownerId: user.id } });
        if (scriptCount >= plan.limits.scripts) {
          return badRequest(`Your ${plan.name} plan is limited to ${plan.limits.scripts} scripts.`);
        }

        const script = await prisma.script.create({
          data: {
            ownerId: user.id,
            name: parsed.data.name,
            description: parsed.data.description,
            game: parsed.data.game,
            scriptContent: parsed.data.scriptContent,
            apiKey: parsed.data.apiKey ?? generateApiKey(),
            discordGuildId: parsed.data.discordGuildId,
            discordRoleId: parsed.data.discordRoleId,
            hwidLock: parsed.data.hwidLock,
            obfuscate: parsed.data.obfuscate,
            accessMode: parsed.data.accessMode,
            trialDurationAmount:
              parsed.data.accessMode === "trial" ? parsed.data.trialDurationAmount ?? 1 : null,
            trialDurationUnit:
              parsed.data.accessMode === "trial" ? parsed.data.trialDurationUnit ?? "hours" : null,
            status: normalizeStatus(parsed.data.status),
          },
        });

        return json(script, { status: 201 });
      },
    },
  },
});
