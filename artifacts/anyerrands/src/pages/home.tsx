import { Link } from "wouter";
import { useGetErrandStats, useGetRecentErrands } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrandCard } from "@/components/errand-card";
import { AnyErrandsLogo } from "@/components/anyerrands-logo";
import { ArrowRight, ClipboardList } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetErrandStats();
  const { data: recentErrands, isLoading: errandsLoading } = useGetRecentErrands({ limit: 4 });

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 480 }}>
        {/* Background image */}
        <img
          src="/hero-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradient overlays — darken edges so text pops */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        {/* Hero content — centred */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 gap-8 min-h-[480px]">

          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <AnyErrandsLogo size="xl" variant="light" />
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
              Nenagh, Co. Tipperary
            </div>
          </div>

          {/* Tagline */}
          <p className="text-white/90 text-xl md:text-2xl font-medium max-w-xl leading-snug drop-shadow-sm">
            Your community, getting things done.<br />
            <span className="text-white/65 text-lg font-normal">Post errands · Find helpers · Pay securely.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full font-bold px-8 h-12 text-base shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="btn-hero-post"
            >
              <Link href="/errands/new">Post an Errand</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full font-bold px-8 h-12 text-base bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white/20 hover:text-white"
              data-testid="btn-hero-helper"
            >
              <Link href="/helpers/new">Become a Helper</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats + content ── */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-10 md:py-14 space-y-14">

        {/* Stats tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -mt-8 relative z-20">
          <MetricTile label="Open Errands"  value={stats?.totalOpen}      loading={statsLoading} accent />
          <MetricTile label="In Progress"   value={stats?.totalAccepted}  loading={statsLoading} />
          <MetricTile label="Completed"     value={stats?.totalCompleted} loading={statsLoading} />
          <MetricTile label="Top Category"  value={stats?.topCategory || "—"} loading={statsLoading} isText />
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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex text-muted-foreground hover:text-foreground font-semibold gap-1.5"
              data-testid="btn-view-all"
            >
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
    <div className={`rounded-xl px-5 py-5 flex flex-col gap-1.5 shadow-md ${accent ? "bg-primary" : "bg-foreground"}`}>
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
