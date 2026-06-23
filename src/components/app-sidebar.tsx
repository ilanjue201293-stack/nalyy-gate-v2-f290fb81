import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileCode2,
  KeyRound,
  ShieldCheck,
  BarChart3,
  Settings,
  PlusCircle,
  Bot,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";

const nav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Scripts", url: "/scripts", icon: FileCode2 },
  { title: "Add Script", url: "/scripts/add", icon: PlusCircle },
  { title: "Key Manager", url: "/keys", icon: KeyRound },
  { title: "Whitelist", url: "/whitelist", icon: ShieldCheck },
  { title: "Statistics", url: "/statistics", icon: BarChart3 },
  { title: "Get Bot", url: "/bot", icon: Bot },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <Logo className="h-9 w-9" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-base font-bold text-gradient">Nalyy Gate</div>
              <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                Script Platform
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:border data-[active=true]:border-primary/30"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
            N
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">nalyy.dev</div>
                <div className="truncate text-xs text-muted-foreground">Pro plan</div>
              </div>
              <Link
                to="/"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
