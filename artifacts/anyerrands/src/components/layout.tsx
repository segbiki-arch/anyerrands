import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Link, useLocation } from "wouter";
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

function UserMenu() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;

  if (!isAuthenticated) {
    return (
      <Button size="sm" variant="outline" className="rounded-full h-8 px-4 text-sm font-medium" onClick={login}>
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
        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarImage src={user?.profileImageUrl ?? undefined} alt={user?.firstName ?? "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold truncate">
            {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account"}
          </p>
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
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
          className="text-destructive focus:text-destructive gap-2 cursor-pointer"
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
  const onNewErrand = location === "/errands/new";
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-border bg-card px-5 gap-2">
            <SidebarTrigger
              className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-muted"
              aria-label="Toggle menu"
              data-testid="button-sidebar-toggle"
            />
            <div className="flex items-center gap-2">
              <NotificationBell />
              {!onNewErrand && (
                <Button asChild size="sm" className="rounded-full h-8 px-4 text-sm font-medium">
                  <Link href="/errands/new">Post an Errand</Link>
                </Button>
              )}
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <footer className="border-t border-border bg-foreground text-background/80 px-6 py-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  <p>© {new Date().getFullYear()} <span className="font-bold text-background">AnyErrands</span> · Made with <span className="text-primary">♥</span> in Nenagh, Co. Tipperary</p>
                </div>
                <p className="font-serif italic text-background/70 pl-4">Small acts of help. Stronger communities.</p>
              </div>
              <div className="flex items-center gap-5 text-xs">
                <Link href="/errands" className="hover:text-primary transition-colors">Browse errands</Link>
                <Link href="/helpers/new" className="hover:text-primary transition-colors">Become a helper</Link>
                <Link href="/help" className="hover:text-primary transition-colors">Help Centre</Link>
                <a href="/help#safety" className="hover:text-primary transition-colors">Safety</a>
                <a href="/help#contact" className="hover:text-primary transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms & Privacy</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
