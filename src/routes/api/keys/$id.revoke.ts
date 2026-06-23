import { createFileRoute } from "@tanstack/react-router";
import { forbidden, json, notFound, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

export const Route = createFileRoute("/api/keys/$id/revoke")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const user = await requireUser(request);
        const key = await prisma.key.findUnique({ where: { id: params.id }, include: { script: true } });
        if (!key) return notFound("Key not found");
        if (!user.isAdmin && key.script.ownerId !== user.id) return forbidden("You do not own this key");
        return json(await prisma.key.update({ where: { id: params.id }, data: { revoked: true } }));
      },
    },
  },
});
