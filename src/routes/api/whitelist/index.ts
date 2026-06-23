import { createFileRoute } from "@tanstack/react-router";
import { json, requireUser } from "@/lib/server/http";
import { whitelistSummaryWhere } from "@/lib/server/access";

export const Route = createFileRoute("/api/whitelist/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request);
        return json(await whitelistSummaryWhere(user.isAdmin ? undefined : user.id));
      },
    },
  },
});
