import { createFileRoute } from "@tanstack/react-router";
import { renderAccessDenied } from "@/lib/server/access-denied";

export const Route = createFileRoute("/api/loader/$scriptId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const accept = request.headers.get("accept") ?? "";
        if (accept.includes("text/html")) {
          return renderAccessDenied("The loader cannot be viewed directly in a browser.");
        }
        const origin = new URL(request.url).origin;
        const sourceUrl = `${origin}/api/source/${params.scriptId}`;
        const bootstrap = `
local env = (getgenv and getgenv()) or _G
local key = rawget(env, "SCRIPT_KEY") or rawget(env, "script_key") or rawget(_G, "SCRIPT_KEY") or rawget(_G, "script_key") or script_key

local hwid = "unknown"
pcall(function()
  if game and game.GetService then
    hwid = game:GetService("RbxAnalyticsService"):GetClientId()
  end
end)

local url = "${sourceUrl}?hwid=" .. tostring(hwid)
if key and key ~= "" then
  url = url .. "&key=" .. tostring(key)
end
local source = game:HttpGet(url)
return loadstring(source)()
`.trim();

        return new Response(bootstrap, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
