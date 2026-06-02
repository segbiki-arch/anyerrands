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

function StripeWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 25" className={className} fill="#635BFF" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe" role="img">
      <path fillRule="evenodd" clipRule="evenodd" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.02-13.17 4.02-.85v3.54h3.14V9.1h-3.14v5.85zm-4.91.66c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.16 13.4 0 14.2 0 9.59 0 6.66 2.25 4.95 5.57 4.95c1.45 0 2.9.22 4.36.79v3.88a9.42 9.42 0 0 0-4.36-1.13c-.86 0-1.4.25-1.4.9 0 1.45 6.2.76 6.2 5.4z" />
    </svg>
  );
}

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
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger
                className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-muted"
                aria-label="Toggle menu"
                data-testid="button-sidebar-toggle"
              />
              <Link href="/" className="font-bold text-base tracking-tight truncate">
                <span className="text-foreground">Any</span>
                <span className="text-primary">Errands</span>
              </Link>
            </div>
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
            <div className="max-w-6xl mx-auto mt-5 pt-4 border-t border-background/15 flex justify-center">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm"
                data-testid="badge-stripe-connect"
              >
                Payments secured &amp; powered by
                <StripeWordmark className="h-4 w-auto" />
                Connect
              </span>
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
