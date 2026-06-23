import { createFileRoute } from "@tanstack/react-router";
import { DurationUnit } from "@prisma/client";
import { z } from "zod";
import { calculateExpiry, generateLicenseKey } from "@/lib/server/access";
import { badRequest, forbidden, json, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { getPlan } from "@/lib/plans";

const bodySchema = z.object({
  scriptId: z.string().min(1),
  quantity: z.number().int().min(1).max(500).default(1),
  durationAmount: z.number().int().positive().optional(),
  durationUnit: z.enum(["minutes", "hours", "days", "weeks", "months"]).optional(),
  lifetime: z.boolean().default(false),
  oneTime: z.boolean().default(false),
  maxHwids: z.number().int().min(1).max(10).default(1),
  redeemedByDiscordId: z.string().optional(),
  note: z.string().optional(),
});

export const Route = createFileRoute("/api/keys/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid key payload", parsed.error.flatten());

        const script = await prisma.script.findUnique({ where: { id: parsed.data.scriptId } });
        if (!script) return badRequest("Script does not exist");
        if (!user.isAdmin && script.ownerId !== user.id) return forbidden("You do not own this script");

        const quantity = parsed.data.oneTime || parsed.data.redeemedByDiscordId ? 1 : parsed.data.quantity;
        const plan = getPlan((user as typeof user & { plan?: string }).plan);
        const currentKeys = await prisma.key.count({ where: { script: { ownerId: user.id } } });
        if (currentKeys + quantity > plan.limits.keys) {
          return badRequest(`Your ${plan.name} plan is limited to ${plan.limits.keys} keys.`);
        }
        const created = await prisma.$transaction(
          Array.from({ length: quantity }, () =>
            prisma.key.create({
              data: {
                scriptId: parsed.data.scriptId,
                keyValue: generateLicenseKey(),
                durationAmount: parsed.data.lifetime ? null : parsed.data.durationAmount,
                durationUnit: parsed.data.lifetime
                  ? null
                  : (parsed.data.durationUnit as DurationUnit | undefined),
                lifetime: parsed.data.lifetime,
                oneTime: parsed.data.oneTime,
                maxHwids: parsed.data.maxHwids,
                redeemedByDiscordId: parsed.data.redeemedByDiscordId,
                expiresAt: parsed.data.lifetime
                  ? null
                  : calculateExpiry(parsed.data.durationAmount, parsed.data.durationUnit as DurationUnit | undefined),
                note: parsed.data.note,
              },
            }),
          ),
        );

        return json({ keys: created }, { status: 201 });
      },
    },
  },
});
