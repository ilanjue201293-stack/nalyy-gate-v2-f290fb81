import { createFileRoute } from "@tanstack/react-router";
import { json, requireUser } from "@/lib/server/http";
import { keySummaryWhere } from "@/lib/server/access";

export const Route = createFileRoute("/api/keys/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request);
        return json(await keySummaryWhere(user.isAdmin ? undefined : user.id));
      },
    },
  },
});
