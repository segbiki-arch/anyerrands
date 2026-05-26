import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Link } from "wouter";
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
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-13 items-center justify-end border-b border-border bg-card px-5 gap-2">
            <NotificationBell />
            <Button asChild size="sm" className="rounded-full h-8 px-4 text-sm font-medium">
              <Link href="/errands/new">Post an Errand</Link>
            </Button>
            <UserMenu />
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
