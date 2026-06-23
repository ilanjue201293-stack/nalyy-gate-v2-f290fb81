import { createFileRoute } from "@tanstack/react-router";
import { forbidden, json, notFound, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

export const Route = createFileRoute("/api/stats/script/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await requireUser(request);
        const script = await prisma.script.findUnique({
          where: { id: params.id },
          include: { _count: { select: { keys: true, whitelist: true, executions: true } } },
        });
        if (!script) return notFound("Script not found");
        if (!user.isAdmin && script.ownerId !== user.id) return forbidden("You do not own this script");

        const executionsByDevice = await prisma.execution.groupBy({
          by: ["deviceType"],
          where: { scriptId: params.id },
          _count: { _all: true },
        });

        return json({
          scriptId: script.id,
          name: script.name,
          keys: script._count.keys,
          whitelist: script._count.whitelist,
          executions: script._count.executions,
          executionsByDevice,
        });
      },
    },
  },
});
