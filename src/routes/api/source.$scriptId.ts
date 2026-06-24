import { createFileRoute } from "@tanstack/react-router";
import { renderAccessDenied } from "@/lib/server/access-denied";

export const Route = createFileRoute("/api/source/$scriptId")({
  server: {
    handlers: {
      GET: async () => {
        return renderAccessDenied("Raw source delivery has been disabled. Use the generated loader.");
      },
    },
  },
});
