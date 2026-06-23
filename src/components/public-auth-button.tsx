import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

export function PublicAuthButton({
  variant = "hero",
  size = "sm",
  loginLabel = "Login",
  dashboardLabel = "Dashboard",
  className,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  loginLabel?: string;
  dashboardLabel?: string;
  className?: string;
}) {
  const isBrowser = typeof window !== "undefined";
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.me().catch(() => ({ user: null })),
    retry: false,
    staleTime: 30_000,
    enabled: isBrowser,
  });
  const loggedIn = !!meQuery.data?.user;

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link to={loggedIn ? "/dashboard" : "/login"}>
        {loggedIn ? dashboardLabel : loginLabel}
      </Link>
    </Button>
  );
}
