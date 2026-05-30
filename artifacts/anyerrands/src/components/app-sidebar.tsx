import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  PlusCircle, 
  UserPlus,
  Map,
  LogIn,
  LogOut,
  ShieldAlert,
  ClipboardList,
  ListChecks,
  Car,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { AnyErrandsLogo } from "./anyerrands-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home, exact: true },
  { href: "/errands", label: "Browse Errands", icon: ClipboardList },
  { href: "/helpers", label: "Find Helpers", icon: Users },
  { href: "/map", label: "Errands Map", icon: Map },
];

const actionItems = [
  { href: "/errands/new", label: "Post an Errand", icon: PlusCircle },
  { href: "/lifts/new", label: "Request a Lift", icon: Car },
  { href: "/helpers/new", label: "Become a Helper", icon: UserPlus },
];

const adminItems = [
  { href: "/admin/reports", label: "Reports Admin", icon: ShieldAlert },
  { href: "/admin/helpers", label: "Helper Profiles", icon: Users },
];

const NAV_BTN = "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/8 data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-semibold";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { isAdmin } = useIsAdmin();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location === href || location.startsWith(href + "/");

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <Sidebar className="border-r-0 bg-sidebar text-sidebar-foreground" data-testid="app-sidebar">

      {/* Logo */}
      <SidebarHeader className="px-5 py-5">
        <Link href="/" data-testid="link-home-logo">
          <AnyErrandsLogo size="sm" variant="light" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Main nav */}
        <SidebarMenu className="space-y-0.5">
          {navItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href, item.exact)}
                className={NAV_BTN}
              >
                <Link href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {isAuthenticated && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/my-errands")}
                className={NAV_BTN}
              >
                <Link href="/my-errands" data-testid="link-nav-your-errands">
                  <ListChecks className="w-4 h-4 shrink-0" />
                  <span>Your Errands</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        {/* Separator */}
        <div className="mx-2 my-4 h-px bg-sidebar-border" />

        {/* Action items */}
        <SidebarMenu className="space-y-0.5">
          {actionItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={NAV_BTN}
              >
                <Link href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Help */}
        <div className="mx-2 my-4 h-px bg-sidebar-border" />
        <SidebarMenu className="space-y-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/help")}
              className={NAV_BTN}
            >
              <Link href="/help" data-testid="link-nav-help-centre">
                <LifeBuoy className="w-4 h-4 shrink-0" />
                <span>Help Centre</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Admin */}
        {isAdmin && (
          <>
            <div className="mx-2 my-4 h-px bg-sidebar-border" />
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 mb-1">Admin</p>
            <SidebarMenu className="space-y-0.5">
              {adminItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={NAV_BTN}
                  >
                    <Link href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </>
        )}
      </SidebarContent>

      {/* Footer — user */}
      <SidebarFooter className="px-3 py-4 border-t border-sidebar-border">
        {isAuthenticated && user ? (
          <div className="space-y-0.5">
            <SidebarMenuButton
              asChild
              isActive={location === "/profile"}
              className={cn(NAV_BTN, "h-auto py-2.5")}
            >
              <Link href="/profile" className="flex items-center gap-3">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={user.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-sidebar-foreground truncate leading-tight">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "My Account"}
                  </p>
                  {user.email && (
                    <p className="text-[11px] text-sidebar-foreground/45 truncate">{user.email}</p>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/8 cursor-pointer text-sm"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </div>
        ) : (
          <SidebarMenuButton
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/8 cursor-pointer"
            onClick={login}
          >
            <LogIn className="w-4 h-4" />
            <span>Log in</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
