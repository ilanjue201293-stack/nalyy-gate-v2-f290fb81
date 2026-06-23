import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { badRequest, json, readJson, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
  email: z.string().email().optional().or(z.literal("")),
  avatar: z.string().url().optional().or(z.literal("")),
});

export const Route = createFileRoute("/api/account/profile")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const user = await requireUser(request);
        const parsed = bodySchema.safeParse(await readJson(request));
        if (!parsed.success) return badRequest("Invalid profile payload", parsed.error.flatten());

        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: parsed.data.username,
            email: parsed.data.email || null,
            avatar: parsed.data.avatar || null,
          },
        });

        return json({
          user: {
            id: updated.id,
            discordId: updated.discordId,
            username: updated.username,
            avatar: updated.avatar,
            email: updated.email,
            plan: (updated as typeof updated & { plan?: string }).plan ?? "free",
            isAdmin: updated.isAdmin,
          },
        });
      },
    },
  },
});
