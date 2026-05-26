import { Link, useLocation } from "wouter";
import { 
  Home, 
  ClipboardList, 
  Users, 
  PlusCircle, 
  UserPlus,
  Map
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

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
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
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
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
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
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
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
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
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
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
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
              className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:rounded-l-none"
            >
              <Link href="/helpers/new" data-testid="link-nav-become-helper">
                <UserPlus className="w-4 h-4" />
                <span>Become a Helper</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}