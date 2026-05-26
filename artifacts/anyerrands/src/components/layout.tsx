import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

function getPageTitle(location: string) {
  if (location === "/") return "Dashboard";
  if (location === "/errands") return "Browse Errands";
  if (location.startsWith("/errands/new")) return "Post an Errand";
  if (location.startsWith("/errands/")) return "Errand Details";
  if (location === "/helpers") return "Find Helpers";
  if (location.startsWith("/helpers/new")) return "Become a Helper";
  if (location.startsWith("/helpers/")) return "Helper Profile";
  if (location === "/map") return "Errands Map";
  if (location === "/profile") return "My Profile";
  return "AnyErrands";
}

function UserMenu() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button size="sm" variant="outline" className="rounded-md shadow-xs" onClick={login}>
        Log in
      </Button>
    );
  }

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName ?? "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold truncate">
            {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account"}
          </p>
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="w-4 h-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const pageTitle = getPageTitle(location);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
            <h1 className="text-lg font-semibold font-sans tracking-tight">{pageTitle}</h1>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-md shadow-xs">
                <Link href="/helpers/new">Become a Helper</Link>
              </Button>
              <Button asChild size="sm" className="rounded-md shadow-xs">
                <Link href="/errands/new">Post an Errand</Link>
              </Button>
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
