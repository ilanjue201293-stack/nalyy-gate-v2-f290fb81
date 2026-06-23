import { createFileRoute } from "@tanstack/react-router";
import { forbidden, json, notFound, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

async function getOwnedKey(id: string, userId: string, isAdmin: boolean) {
  const key = await prisma.key.findUnique({ where: { id }, include: { script: true } });
  if (!key) return null;
  if (!isAdmin && key.script.ownerId !== userId) throw forbidden("You do not own this key");
  return key;
}

export const Route = createFileRoute("/api/keys/$id")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const user = await requireUser(request);
        const key = await getOwnedKey(params.id, user.id, user.isAdmin);
        if (!key) return notFound("Key not found");
        await prisma.key.delete({ where: { id: params.id } });
        return json({ ok: true });
      },
    },
  },
});
