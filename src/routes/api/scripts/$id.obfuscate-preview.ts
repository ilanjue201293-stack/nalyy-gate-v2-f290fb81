import { createFileRoute } from "@tanstack/react-router";
import { obfuscateLua } from "@/lib/server/access";
import { forbidden, json, notFound, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

export const Route = createFileRoute("/api/scripts/$id/obfuscate-preview")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await requireUser(request);
        const script = await prisma.script.findUnique({ where: { id: params.id } });
        if (!script) return notFound("Script not found");
        if (!user.isAdmin && script.ownerId !== user.id) return forbidden("You do not own this script");

        return json({
          code: obfuscateLua(script.scriptContent),
          generatedAt: new Date().toISOString(),
        });
      },
    },
  },
});
