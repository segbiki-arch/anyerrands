import { Link } from "wouter";
import { useGetErrandStats, useGetRecentErrands } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrandCard } from "@/components/errand-card";
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight
} from "lucide-react";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetErrandStats();
  const { data: recentErrands, isLoading: errandsLoading } = useGetRecentErrands({ limit: 4 });

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 lg:p-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
            The community <br/>bulletin board.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Need a hand? Or have some time to help out? AnyErrands connects neighbors to get things done together.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Button asChild size="lg" className="rounded-full shadow-sm">
            <Link href="/errands/new" data-testid="btn-hero-post">Post an Errand</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="rounded-full shadow-sm">
            <Link href="/helpers/new" data-testid="btn-hero-helper">Become a Helper</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Open Errands" 
          value={stats?.totalOpen} 
          loading={statsLoading} 
          icon={<ClipboardList className="w-5 h-5 text-primary" />} 
        />
        <StatCard 
          title="In Progress" 
          value={stats?.totalAccepted} 
          loading={statsLoading} 
          icon={<Clock className="w-5 h-5 text-amber-500" />} 
        />
        <StatCard 
          title="Completed" 
          value={stats?.totalCompleted} 
          loading={statsLoading} 
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} 
        />
        <StatCard 
          title="Top Category" 
          value={stats?.topCategory || "None"} 
          loading={statsLoading} 
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />} 
          isString
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold">Recent Requests</h2>
          <Button asChild variant="ghost" className="hidden sm:flex" data-testid="btn-view-all">
            <Link href="/errands">
              View all <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {errandsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : recentErrands && recentErrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentErrands.map(errand => (
              <ErrandCard key={errand.id} errand={errand} />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">No recent errands</p>
              <p className="text-sm text-muted-foreground mb-6">Be the first to post a request in your neighborhood.</p>
              <Button asChild>
                <Link href="/errands/new" data-testid="btn-empty-post">Post an Errand</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Button asChild variant="outline" className="w-full sm:hidden">
          <Link href="/errands">
            View all errands
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon, isString = false }: { title: string, value?: number | string, loading: boolean, icon: React.ReactNode, isString?: boolean }) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-xs">
      <CardContent className="p-6 flex flex-col justify-center h-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-muted rounded-lg shrink-0">
            {icon}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-serif font-bold text-foreground">
            {value !== undefined ? value : (isString ? "-" : "0")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}