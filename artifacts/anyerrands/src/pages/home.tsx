import { Link } from "wouter";
import { useGetErrandStats, useGetRecentErrands } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="max-w-6xl mx-auto p-6 md:p-10 lg:p-12 space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-sans font-extrabold text-foreground tracking-tight leading-[1.1]">
            Your community,<br />getting things done.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            Connect with neighbors to accomplish tasks together on a fast, modern platform.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Button asChild size="lg" className="rounded-full shadow-sm font-semibold px-8">
            <Link href="/errands/new" data-testid="btn-hero-post">Post an Errand</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full shadow-sm font-semibold px-8 bg-transparent">
            <Link href="/helpers/new" data-testid="btn-hero-helper">Become a Helper</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Open Errands" 
          value={stats?.totalOpen} 
          loading={statsLoading} 
          accentColor="border-primary"
        />
        <StatCard 
          title="In Progress" 
          value={stats?.totalAccepted} 
          loading={statsLoading} 
          accentColor="border-blue-500"
        />
        <StatCard 
          title="Completed" 
          value={stats?.totalCompleted} 
          loading={statsLoading} 
          accentColor="border-green-500"
        />
        <StatCard 
          title="Top Category" 
          value={stats?.topCategory || "None"} 
          loading={statsLoading} 
          accentColor="border-purple-500"
          isString
        />
      </div>

      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-sans font-bold tracking-tight">Recent Requests</h2>
            {recentErrands && recentErrands.length > 0 && (
              <span className="bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {recentErrands.length}
              </span>
            )}
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground font-semibold" data-testid="btn-view-all">
            <Link href="/errands">
              View all <ArrowRight className="ml-1.5 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {errandsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ) : recentErrands && recentErrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recentErrands.map(errand => (
              <ErrandCard key={errand.id} errand={errand} />
            ))}
          </div>
        ) : (
          <Card className="bg-card border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-5" />
              <p className="text-lg font-bold text-foreground">No recent errands</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mt-2">There are no open errands in your area right now. Be the first to post a request.</p>
              <Button asChild className="rounded-full px-6">
                <Link href="/errands/new" data-testid="btn-empty-post">Post an Errand</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Button asChild variant="outline" className="w-full sm:hidden rounded-full">
          <Link href="/errands">
            View all errands
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, accentColor, isString = false }: { title: string, value?: number | string, loading: boolean, accentColor: string, isString?: boolean }) {
  return (
    <Card className={`overflow-hidden border-l-4 ${accentColor} shadow-sm rounded-lg`}>
      <CardContent className="p-5 flex flex-col justify-center h-full space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        {loading ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <p className="text-4xl font-sans font-extrabold text-foreground tracking-tight">
            {value !== undefined ? value : (isString ? "-" : "0")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}