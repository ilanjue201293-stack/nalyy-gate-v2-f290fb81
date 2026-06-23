import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { getEnv, getRequiredEnv } from "@/lib/server/env";

export const Route = createFileRoute("/api/auth/discord")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = getRequiredEnv("DISCORD_CLIENT_ID");
        const redirectUri = getRequiredEnv("DISCORD_REDIRECT_URI");
        const state = randomBytes(16).toString("hex");
        const url = new URL("https://discord.com/oauth2/authorize");

        url.searchParams.set("client_id", clientId);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "identify email");
        url.searchParams.set("state", state);

        const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
        return new Response(null, {
          status: 302,
          headers: {
            location: url.toString(),
            "set-cookie": `ng_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
          },
        });
      },
    },
  },
});

export function getAvatarUrl(discordId: string, avatar?: string | null) {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
}

export function getAppUrl() {
  return getEnv("APP_URL", "http://localhost:5173");
}
