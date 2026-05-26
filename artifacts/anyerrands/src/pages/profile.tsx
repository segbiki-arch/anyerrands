import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, User, LogIn, LogOut, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-muted-foreground mb-8">
          Log in to access your profile, track your errands, and manage your helper account.
        </p>
        <Button size="lg" className="rounded-md" onClick={login}>
          <LogIn className="w-4 h-4 mr-2" />
          Log in
        </Button>
      </div>
    );
  }

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      {/* Profile card */}
      <Card className="border border-card-border shadow-sm">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-serif font-bold">{displayName}</h1>
              {user?.email && (
                <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Shield className="w-3.5 h-3.5" />
              Verified member
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Account details */}
      <Card className="border border-card-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">First name</span>
            <span className="text-sm font-medium">{user?.firstName ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Last name</span>
            <span className="text-sm font-medium">{user?.lastName ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Account ID</span>
            <span className="text-xs font-mono text-muted-foreground">{user?.id?.slice(0, 12)}…</span>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
