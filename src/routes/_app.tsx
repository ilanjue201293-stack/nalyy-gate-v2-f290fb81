import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-3 backdrop-blur-xl sm:px-6">
            <SidebarTrigger className="hover:bg-accent/15" />
            <div className="relative hidden flex-1 max-w-md sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search scripts, keys, users…"
                className="h-9 border-border/60 bg-card/50 pl-9 backdrop-blur"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_oklch(0.7_0.2_240)]" />
              </Button>
              <div className="hidden h-9 items-center gap-2 rounded-full border border-border bg-card/60 px-3 sm:flex">
                <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_oklch(0.72_0.18_155)]" />
                <span className="text-xs text-muted-foreground">All systems normal</span>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
