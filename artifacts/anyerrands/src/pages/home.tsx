import { Link } from "wouter";
import { useGetErrandStats, useGetRecentErrands } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrandCard } from "@/components/errand-card";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetErrandStats();
  const { data: recentErrands, isLoading: errandsLoading } = useGetRecentErrands({ limit: 4 });

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 space-y-14">

      {/* Hero */}
      <div className="flex flex-col gap-8">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            Nenagh, Co. Tipperary
          </div>
          <h1 className="text-5xl md:text-7xl font-sans font-extrabold text-foreground tracking-tight leading-[1.05]">
            Your community,<br />getting things done.
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-xl">
            Post errands, find local helpers, and get things done — fast and safe.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full font-semibold px-8 h-12 text-base shadow-sm" data-testid="btn-hero-post">
            <Link href="/errands/new">Post an Errand</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full font-semibold px-8 h-12 text-base bg-transparent" data-testid="btn-hero-helper">
            <Link href="/helpers/new">Become a Helper</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile label="Open Errands" value={stats?.totalOpen} loading={statsLoading} accent />
        <MetricTile label="In Progress" value={stats?.totalAccepted} loading={statsLoading} />
        <MetricTile label="Completed" value={stats?.totalCompleted} loading={statsLoading} />
        <MetricTile label="Top Category" value={stats?.topCategory || "—"} loading={statsLoading} isText />
      </div>

      {/* Recent errands */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-sans font-bold tracking-tight">Recent Requests</h2>
            {recentErrands && recentErrands.length > 0 && (
              <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
                {recentErrands.length}
              </span>
            )}
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground font-semibold gap-1.5" data-testid="btn-view-all">
            <Link href="/errands">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {errandsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : recentErrands && recentErrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentErrands.map(errand => (
              <ErrandCard key={errand.id} errand={errand} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-lg font-bold">No recent errands</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Be the first to post a request in your area.</p>
            </div>
            <Button asChild className="rounded-full px-6 mt-2">
              <Link href="/errands/new" data-testid="btn-empty-post">Post an Errand</Link>
            </Button>
          </div>
        )}

        <Button asChild variant="outline" className="w-full sm:hidden rounded-full">
          <Link href="/errands">View all errands</Link>
        </Button>
      </div>
    </div>
  );
}

function MetricTile({
  label, value, loading, accent = false, isText = false,
}: {
  label: string;
  value?: number | string;
  loading: boolean;
  accent?: boolean;
  isText?: boolean;
}) {
  return (
    <div className={`rounded-xl px-5 py-5 flex flex-col gap-1.5 ${accent ? "bg-primary" : "bg-foreground"}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${accent ? "text-primary-foreground/70" : "text-background/50"}`}>
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-9 w-16 bg-white/20 rounded" />
      ) : (
        <p className={`font-sans font-extrabold tracking-tight ${isText ? "text-2xl" : "text-4xl"} ${accent ? "text-primary-foreground" : "text-background"}`}>
          {value !== undefined ? value : (isText ? "—" : "0")}
        </p>
      )}
    </div>
  );
}
