import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { normalizePlan } from "@/lib/plans";
import { badRequest, json, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({
  plan: z.enum(["free", "plus", "pro", "unlimited"]),
});

export const Route = createFileRoute("/api/billing/select-plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid plan payload", parsed.error.flatten());

        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { plan: parsed.data.plan } as { plan: string },
        });

        return json({ plan: normalizePlan((updated as typeof updated & { plan?: string }).plan) });
      },
    },
  },
});
