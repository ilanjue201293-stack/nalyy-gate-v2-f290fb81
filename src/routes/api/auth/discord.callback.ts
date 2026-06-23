import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/server/prisma";
import { createSession, sessionCookie } from "@/lib/server/http";
import { getRequiredEnv } from "@/lib/server/env";
import { getAppUrl, getAvatarUrl } from "./discord";

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
};

function getCookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const cookieState = getCookie(request, "ng_oauth_state");

        if (!code || !state || !cookieState || state !== cookieState) {
          return Response.redirect(`${getAppUrl()}/login?error=oauth_state`, 302);
        }

        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: getRequiredEnv("DISCORD_CLIENT_ID"),
            client_secret: getRequiredEnv("DISCORD_CLIENT_SECRET"),
            grant_type: "authorization_code",
            code,
            redirect_uri: getRequiredEnv("DISCORD_REDIRECT_URI"),
          }),
        });

        if (!tokenResponse.ok) {
          return Response.redirect(`${getAppUrl()}/login?error=discord_token`, 302);
        }

        const token = (await tokenResponse.json()) as { access_token: string };
        const userResponse = await fetch("https://discord.com/api/users/@me", {
          headers: { authorization: `Bearer ${token.access_token}` },
        });

        if (!userResponse.ok) {
          return Response.redirect(`${getAppUrl()}/login?error=discord_user`, 302);
        }

        const discordUser = (await userResponse.json()) as DiscordUser;
        const existingAdmins = await prisma.user.count({ where: { isAdmin: true } });
        const adminIds = (process.env.DISCORD_ADMIN_IDS ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        const existingUser = await prisma.user.findUnique({
          where: { discordId: discordUser.id },
          select: { avatar: true },
        });
        const discordAvatar = getAvatarUrl(discordUser.id, discordUser.avatar);

        const user = await prisma.user.upsert({
          where: { discordId: discordUser.id },
          create: {
            discordId: discordUser.id,
            username: discordUser.global_name ?? discordUser.username,
            avatar: discordAvatar,
            email: discordUser.email,
            isAdmin: existingAdmins === 0 || adminIds.includes(discordUser.id),
          },
          update: {
            username: discordUser.global_name ?? discordUser.username,
            avatar: existingUser?.avatar ?? discordAvatar,
            email: discordUser.email,
            isAdmin: adminIds.includes(discordUser.id) ? true : undefined,
          },
        });

        const session = await createSession(user.id);
        const headers = new Headers({
          location: `${getAppUrl()}/dashboard`,
        });
        headers.append("set-cookie", sessionCookie(session.token, session.expiresAt));
        headers.append(
          "set-cookie",
          "ng_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
        );

        return new Response(null, {
          status: 302,
          headers,
        });
      },
    },
  },
});
