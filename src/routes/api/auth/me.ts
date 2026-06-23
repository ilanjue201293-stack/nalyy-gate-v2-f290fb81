import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, getCurrentUser, json } from "@/lib/server/http";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getCurrentUser(request);
        if (!user) {
          return json({ user: null }, { status: 401 });
        }
        return json({
          user: {
            id: user.id,
            discordId: user.discordId,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            plan: (user as typeof user & { plan?: string }).plan ?? "free",
            isAdmin: user.isAdmin,
          },
        });
      },
      DELETE: async () => {
        return json(
          { ok: true },
          {
            headers: {
              "set-cookie": clearSessionCookie(),
            },
          },
        );
      },
    },
  },
});
