import { ListTodo, LayoutDashboard, History, LogOut, Moon, Sun, CheckCircle2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Tasks", url: "/", icon: ListTodo },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-xl bg-mint-gradient grid place-items-center shadow-glow">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md -z-10" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold leading-none tracking-tight">
                Just Do It
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                Focus · Ship · Repeat
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {!collapsed && "Workspace"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10 rounded-lg group">
                    <NavLink
                      to={item.url}
                      end
                      className="relative flex items-center gap-3 px-3 hover:bg-sidebar-accent/70 transition-colors"
                      activeClassName="!bg-sidebar-accent text-primary font-semibold"
                      onClick={handleNavClick}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-mint-gradient shadow-glow" />
                      )}
                      <item.icon
                        className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                          isActive ? "text-primary" : ""
                        }`}
                      />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9 rounded-lg hover:bg-sidebar-accent/70"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="text-sm">{theme === "dark" ? "Light" : "Dark"} mode</span>}
        </Button>

        {!collapsed && user && (
          <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 p-2.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-mint-gradient grid place-items-center text-[11px] font-semibold text-primary-foreground shrink-0">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <p className="truncate text-xs font-medium">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 h-8 mt-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center h-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
