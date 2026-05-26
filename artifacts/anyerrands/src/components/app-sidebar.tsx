import { Link, useLocation } from "wouter";
import { 
  Home, 
  ClipboardList, 
  Users, 
  PlusCircle, 
  UserPlus,
  Map,
  User,
  LogIn,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <Sidebar className="border-r-0 bg-sidebar text-sidebar-foreground" data-testid="app-sidebar">
      <SidebarHeader className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-home-logo">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground shadow-sm">
            <ClipboardList className="w-5 h-5" />
          </div>
          <span className="font-sans font-bold tracking-tight text-xl text-white">AnyErrands</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-4 space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/" data-testid="link-nav-dashboard">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/errands"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/errands" data-testid="link-nav-errands">
                <ClipboardList className="w-4 h-4" />
                <span>Browse Errands</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/helpers"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/helpers" data-testid="link-nav-helpers">
                <Users className="w-4 h-4" />
                <span>Find Helpers</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === "/map"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/map" data-testid="link-nav-map">
                <Map className="w-4 h-4" />
                <span>Errands Map</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <div className="pt-8 pb-3 px-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-widest">
            Actions
          </div>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/errands/new"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/errands/new" data-testid="link-nav-post-errand">
                <PlusCircle className="w-4 h-4" />
                <span>Post an Errand</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/helpers/new"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/helpers/new" data-testid="link-nav-become-helper">
                <UserPlus className="w-4 h-4" />
                <span>Become a Helper</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-sidebar-border">
        {isAuthenticated && user ? (
          <div className="space-y-1">
            <SidebarMenuButton
              asChild
              isActive={location === "/profile"}
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-primary/20 data-[active=true]:text-primary w-full"
            >
              <Link href="/profile" className="flex items-center gap-3">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={user.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "My Account"}
                  </p>
                  {user.email && (
                    <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton
              className="text-sidebar-foreground/60 hover:text-white hover:bg-white/10 w-full cursor-pointer"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </div>
        ) : (
          <SidebarMenuButton
            className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 w-full cursor-pointer"
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
