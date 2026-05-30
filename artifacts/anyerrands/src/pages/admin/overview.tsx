import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  ArrowLeft,
  Users,
  UserCheck,
  ClipboardList,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

type AdminStats = {
  totalUsers: number;
  totalHelpers: number;
  totalReports: number;
  totalErrands: number;
  errandsByStatus: { open: number; accepted: number; completed: number };
};

export default function AdminOverviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      setStats(await res.json());
    } catch {
      toast({ title: "Couldn't load your numbers", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="mr-2 w-4 h-4" /> Back home
      </Button>

      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-2 rounded-full"
          onClick={load}
          disabled={loading}
          data-testid="btn-refresh-stats"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <p className="text-sm text-muted-foreground -mt-4">
        A live snapshot of your community on AnyErrands.
      </p>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Headline: total registered users */}
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered users</p>
                <p className="text-4xl font-bold leading-tight" data-testid="stat-total-users">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Everyone who has signed up to your site.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Supporting numbers */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<UserCheck className="w-5 h-5 text-primary" />}
              label="Helper profiles"
              value={stats.totalHelpers}
              hint="People signed up to earn"
              testId="stat-total-helpers"
            />
            <StatCard
              icon={<ClipboardList className="w-5 h-5 text-primary" />}
              label="Total errands"
              value={stats.totalErrands}
              hint={`${stats.errandsByStatus.open} open · ${stats.errandsByStatus.accepted} in progress · ${stats.errandsByStatus.completed} completed`}
              testId="stat-total-errands"
            />
            <StatCard
              icon={<ShieldAlert className="w-5 h-5 text-primary" />}
              label="Reports filed"
              value={stats.totalReports}
              hint="Helper reports to review"
              testId="stat-total-reports"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  testId: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="text-3xl font-bold" data-testid={testId}>
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
