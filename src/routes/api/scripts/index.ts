import { createFileRoute } from "@tanstack/react-router";
import { json, requireUser } from "@/lib/server/http";
import { scriptSummaryWhere } from "@/lib/server/access";

export const Route = createFileRoute("/api/scripts/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request);
        return json(await scriptSummaryWhere(user.isAdmin ? undefined : user.id));
      },
    },
  },
});
