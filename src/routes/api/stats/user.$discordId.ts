import { createFileRoute } from "@tanstack/react-router";
import { json, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

export const Route = createFileRoute("/api/stats/user/$discordId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const user = await requireUser(request);
        const scriptWhere = user.isAdmin ? {} : { ownerId: user.id };
        const scriptIds = (await prisma.script.findMany({ where: scriptWhere, select: { id: true } })).map(
          (script) => script.id,
        );
        const where = {
          discordId: params.discordId,
          scriptId: { in: scriptIds },
        };

        const [executions, whitelist, scriptsUsed] = await Promise.all([
          prisma.execution.count({ where }),
          prisma.whitelist.findMany({
            where: { discordId: params.discordId, scriptId: { in: scriptIds } },
            include: { script: true },
          }),
          prisma.execution.groupBy({
            by: ["scriptId"],
            where,
            _count: { _all: true },
          }),
        ]);

        return json({
          discordId: params.discordId,
          executions,
          whitelist,
          scriptsUsed: scriptsUsed.length,
          byScript: scriptsUsed,
        });
      },
    },
  },
});
