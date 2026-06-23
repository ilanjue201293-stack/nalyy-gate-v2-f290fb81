import { createFileRoute } from "@tanstack/react-router";
import { json, requireUser } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { keySummaryWhere } from "@/lib/server/access";

function startOfDay(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export const Route = createFileRoute("/api/stats/global")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request);
        const scriptWhere = user.isAdmin ? {} : { ownerId: user.id };
        const scriptIds = (await prisma.script.findMany({ where: scriptWhere, select: { id: true } })).map(
          (script) => script.id,
        );
        const byScript = scriptIds.length ? { scriptId: { in: scriptIds } } : { scriptId: "__none__" };
        const [
          scripts,
          activeScripts,
          keys,
          whitelistUsers,
          executions,
          allKeys,
          executionsRaw,
          modeRows,
          activeTrials,
          topUserRows,
        ] =
          await Promise.all([
            prisma.script.count({ where: scriptWhere }),
            prisma.script.count({ where: { ...scriptWhere, status: "active" } }),
            prisma.key.count({ where: byScript }),
            prisma.whitelist.count({ where: { ...byScript, active: true } }),
            prisma.execution.count({ where: byScript }),
            keySummaryWhere(user.isAdmin ? undefined : user.id),
            prisma.execution.findMany({
              where: { ...byScript, createdAt: { gte: startOfDay(6) } },
              select: { createdAt: true },
            }),
            prisma.script.groupBy({
              by: ["accessMode"],
              where: scriptWhere,
              _count: { _all: true },
            }),
            prisma.key.count({
              where: {
                ...byScript,
                note: "Trial access",
                revoked: false,
                expiresAt: { gt: new Date() },
              },
            }),
            prisma.execution.groupBy({
              by: ["discordId"],
              where: { ...byScript, discordId: { not: null } },
              _count: { _all: true },
              _max: { createdAt: true },
              orderBy: { _count: { discordId: "desc" } },
              take: 10,
            }),
          ]);

        const executionsByDay = Array.from({ length: 7 }, (_, index) => {
          const date = startOfDay(6 - index);
          const next = new Date(date);
          next.setDate(date.getDate() + 1);
          return {
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            execs: executionsRaw.filter((row) => row.createdAt >= date && row.createdAt < next).length,
            keys: 0,
          };
        });

        const topUsers = await Promise.all(
          topUserRows
            .filter((row) => row.discordId)
            .map(async (row) => {
              const discordId = row.discordId!;
              const [scriptsUsed, hwids, topScriptRow, userExecutionsRaw] = await Promise.all([
                prisma.execution.groupBy({
                  by: ["scriptId"],
                  where: { ...byScript, discordId },
                  _count: { _all: true },
                }),
                prisma.whitelist.count({
                  where: { ...byScript, discordId, hwid: { not: null } },
                }),
                prisma.execution.groupBy({
                  by: ["scriptId"],
                  where: { ...byScript, discordId },
                  _count: { _all: true },
                  orderBy: { _count: { scriptId: "desc" } },
                  take: 1,
                }),
                prisma.execution.findMany({
                  where: { ...byScript, discordId, createdAt: { gte: startOfDay(6) } },
                  select: { createdAt: true },
                }),
              ]);
              const topScript = topScriptRow[0]
                ? await prisma.script.findUnique({ where: { id: topScriptRow[0].scriptId } })
                : null;
              return {
                tag: discordId,
                discordId,
                executions: row._count._all,
                scriptsUsed: scriptsUsed.length,
                lastActive: row._max.createdAt?.toISOString() ?? "never",
                joined: "",
                hwids,
                topScript: topScript?.name ?? "-",
                weekly: executionsByDay.map((day, index) => {
                  const date = startOfDay(6 - index);
                  const next = new Date(date);
                  next.setDate(date.getDate() + 1);
                  return {
                    day: day.day,
                    execs: userExecutionsRaw.filter((item) => item.createdAt >= date && item.createdAt < next).length,
                  };
                }),
              };
            }),
        );

        return json({
          totals: {
            scripts,
            activeScripts,
            keys,
            activeKeys: allKeys.filter((key) => key.status === "active" || key.status === "unused").length,
            whitelistUsers,
            onlineUsers: whitelistUsers,
            executions,
          },
          executionsByDay,
          topUsers,
          accessModes: {
            free: modeRows.find((row) => row.accessMode === "free")?._count._all ?? 0,
            trial: modeRows.find((row) => row.accessMode === "trial")?._count._all ?? 0,
            key: modeRows.find((row) => row.accessMode === "key")?._count._all ?? 0,
            activeTrials,
          },
        });
      },
    },
  },
});
