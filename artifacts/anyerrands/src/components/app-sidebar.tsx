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
    <Sidebar className="border-r border-border bg-sidebar" data-testid="app-sidebar">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 px-2" data-testid="link-home-logo">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <ClipboardList className="w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-xl text-sidebar-foreground">AnyErrands</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/"}
              tooltip="Dashboard"
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
              tooltip="Browse Errands"
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
              tooltip="Find Helpers"
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
              tooltip="Errands Map"
            >
              <Link href="/map" data-testid="link-nav-map">
                <Map className="w-4 h-4" />
                <span>Errands Map</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <div className="pt-6 pb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Actions
          </div>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={location === "/errands/new"}
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