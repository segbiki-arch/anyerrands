import { useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useListErrands, useListHelpers } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrandCard } from "@/components/errand-card";
import { HelperCard } from "@/components/helper-card";
import {
  Mail,
  LogIn,
  LogOut,
  Shield,
  User,
  ClipboardList,
  UserPlus,
  PlusCircle,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account";

  const { data: allErrands, isLoading: errandsLoading } = useListErrands(
    undefined,
    { query: { enabled: isAuthenticated } },
  );
  const { data: allHelpers, isLoading: helpersLoading } = useListHelpers(
    undefined,
    { query: { enabled: isAuthenticated } },
  );

  const myErrands = useMemo(() => {
    if (!allErrands || !user) return [];
    const nameKey = displayName.toLowerCase().trim();
    const emailKey = user.email?.toLowerCase().trim();
    return allErrands.filter(
      e =>
        e.requesterName.toLowerCase().trim() === nameKey ||
        (emailKey && e.requesterName.toLowerCase().includes(emailKey)),
    );
  }, [allErrands, user, displayName]);

  const myHelperProfile = useMemo(() => {
    if (!allHelpers || !user) return undefined;
    const nameKey = displayName.toLowerCase().trim();
    return allHelpers.find(h => h.name.toLowerCase().trim() === nameKey);
  }, [allHelpers, user, displayName]);

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Profile header */}
      <Card className="border border-card-border shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary via-primary to-primary/80" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            <Avatar className="w-24 h-24 ring-4 ring-card">
              <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-foreground text-background text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left sm:pb-1">
              <h1 className="text-2xl font-serif font-bold">{displayName}</h1>
              {user?.email && (
                <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                <Badge variant="secondary" className="gap-1.5">
                  <Shield className="w-3 h-3" />
                  Verified
                </Badge>
                {myHelperProfile && (
                  <Badge className="gap-1.5 bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3" />
                    Helper
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
              onClick={logout}
              data-testid="btn-sign-out"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="errands" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="errands" data-testid="tab-my-errands">
            My Errands {myErrands.length > 0 && <span className="ml-1.5 text-xs opacity-70">({myErrands.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="helper" data-testid="tab-helper">
            Helper Profile
          </TabsTrigger>
          <TabsTrigger value="account" data-testid="tab-account">
            Account
          </TabsTrigger>
        </TabsList>

        {/* My Errands */}
        <TabsContent value="errands" className="space-y-4">
          {errandsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-xl" />
              ))}
            </div>
          ) : myErrands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myErrands.map(e => (
                <ErrandCard key={e.id} errand={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardList className="w-7 h-7 text-muted-foreground/50" />}
              title="No errands posted yet"
              description="When you post an errand, it'll show up here so you can track it."
              cta={{ href: "/errands/new", label: "Post an Errand", icon: <PlusCircle className="w-4 h-4" /> }}
            />
          )}
        </TabsContent>

        {/* Helper profile */}
        <TabsContent value="helper" className="space-y-4">
          {helpersLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : myHelperProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HelperCard helper={myHelperProfile} />
              <Card className="border border-card-border shadow-sm flex items-center justify-center p-6">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/helpers/${myHelperProfile.id}`}>Manage helper profile →</Link>
                </Button>
              </Card>
            </div>
          ) : (
            <EmptyState
              icon={<UserPlus className="w-7 h-7 text-muted-foreground/50" />}
              title="You haven't set up a helper profile"
              description="Create a profile so neighbors can hire you for errands in your area."
              cta={{ href: "/helpers/new", label: "Become a Helper", icon: <UserPlus className="w-4 h-4" /> }}
            />
          )}
        </TabsContent>

        {/* Account details */}
        <TabsContent value="account">
          <Card className="border border-card-border shadow-sm">
            <CardContent className="pt-6 space-y-1">
              <Row label="First name" value={user?.firstName ?? "—"} />
              <Row label="Last name" value={user?.lastName ?? "—"} />
              <Row label="Email" value={user?.email ?? "—"} />
              <Row label="Account ID" value={user?.id?.slice(0, 12) + "…"} mono />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs text-muted-foreground" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: { href: string; label: string; icon: React.ReactNode };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      </div>
      <Button asChild className="rounded-full px-6 mt-2 gap-2">
        <Link href={cta.href}>
          {cta.icon}
          {cta.label}
        </Link>
      </Button>
    </div>
  );
}
