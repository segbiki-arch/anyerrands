import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./notification-bell";

function getPageTitle(location: string) {
  if (location === "/") return "Dashboard";
  if (location === "/errands") return "Browse Errands";
  if (location.startsWith("/errands/new")) return "Post an Errand";
  if (location.startsWith("/errands/")) return "Errand Details";
  if (location === "/helpers") return "Find Helpers";
  if (location.startsWith("/helpers/new")) return "Become a Helper";
  if (location.startsWith("/helpers/")) return "Helper Profile";
  if (location === "/map") return "Errands Map";
  return "AnyErrands";
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