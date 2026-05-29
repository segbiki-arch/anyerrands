import { Link } from "wouter";
import { useGetErrandStats, useGetRecentErrands } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrandCard } from "@/components/errand-card";
import { AnyErrandsLogo } from "@/components/anyerrands-logo";
import {
  ArrowRight,
  ClipboardList,
  ShoppingBag,
  PawPrint,
  Pill,
  Hammer,
  Sparkles,
  Truck,
  Leaf,
  HelpingHand,
  ShieldCheck,
  Zap,
  Heart,
  MapPin,
  Car,
  Plane,
} from "lucide-react";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetErrandStats();
  const { data: recentErrands, isLoading: errandsLoading } = useGetRecentErrands({ limit: 4 });

  return (
    <div className="flex flex-col">

      {/* ──────────────── HERO ──────────────── */}
      <div className="relative w-full overflow-hidden bg-foreground" style={{ minHeight: 560 }}>
        {/* Background image */}
        <img
          src="/hero-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />

        {/* Floating gradient orbs */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary/30 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full bg-primary/20 blur-3xl animate-pulse-slower" />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 gap-7 min-h-[560px]">

          {/* Live location pill */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full animate-fade-down">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
            </span>
            <MapPin className="w-3.5 h-3.5" />
            Live in Nenagh, Co. Tipperary
          </div>

          {/* Logo */}
          <div className="animate-fade-up">
            <AnyErrandsLogo size="xl" variant="light" />
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-fade-up [animation-delay:120ms]">
            <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-3xl drop-shadow-lg">
              Your neighbours.<br />
              <span className="bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
                Getting things done.
              </span>
            </h1>
            <p className="text-white/85 text-lg sm:text-xl max-w-xl mx-auto leading-snug drop-shadow">
              Post an errand. A local helper does it. Pay securely — only when the job's done.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center animate-fade-up [animation-delay:240ms]">
            <Button
              asChild
              size="lg"
              className="rounded-full font-bold px-8 h-14 text-base shadow-2xl shadow-primary/30 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform"
              data-testid="btn-hero-post"
            >
              <Link href="/errands/new">Post an Errand</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full font-bold px-8 h-14 text-base bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white/20 hover:text-white hover:scale-105 transition-transform"
              data-testid="btn-hero-helper"
            >
              <Link href="/helpers/new">Become a Helper</Link>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/75 text-xs sm:text-sm pt-2 animate-fade-up [animation-delay:360ms]">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Secure Stripe payments</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> Posted in 30 seconds</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-primary" /> Built in Nenagh</span>
          </div>
        </div>
      </div>

      {/* ──────────────── STATS TILES ──────────────── */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Open Errands"  value={stats?.totalOpen}      loading={statsLoading} accent />
          <MetricTile label="In Progress"   value={stats?.totalAccepted}  loading={statsLoading} />
          <MetricTile label="Completed"     value={stats?.totalCompleted} loading={statsLoading} />
          <MetricTile label="Top Category"  value={stats?.topCategory || "—"} loading={statsLoading} isText />
        </div>
      </div>

      {/* ──────────────── MAIN CONTENT ──────────────── */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-14 md:py-20 space-y-20">

        {/* ── Lifts / rides banner ── */}
        <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 shadow-2xl shadow-primary/30">
          <div className="absolute -top-16 -right-10 w-[300px] h-[300px] rounded-full bg-black/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 w-[260px] h-[260px] rounded-full bg-black/5 blur-3xl" />
          <Car className="absolute right-6 bottom-4 w-40 h-40 text-black/5 hidden md:block" aria-hidden />
          <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-black/10 border border-black/15 text-primary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <Plane className="w-3.5 h-3.5" /> Need a lift?
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Nenagh ↔ Shannon, Limerick<br className="hidden sm:block" /> &amp; surrounding areas
              </h3>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-lg">
                Heading to the airport or into town? Request a lift from a local driver — or offer your own seats and earn on the journey you're already making.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Limerick", "Shannon Airport", "Thurles", "Roscrea", "Nenagh Town"].map((p) => (
                  <span key={p} className="flex items-center gap-1.5 bg-black/10 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex md:justify-end">
              <Button
                asChild
                size="lg"
                className="rounded-full font-bold px-8 h-14 text-base shadow-xl shadow-black/20 bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
                data-testid="btn-request-lift"
              >
                <Link href="/lifts/new">Request a Lift <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Three steps. That's it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              n={1}
              title="Post your errand"
              body="Tell us what you need done and how much you'll pay. Takes 30 seconds."
              icon={<ClipboardList className="w-6 h-6" />}
            />
            <StepCard
              n={2}
              title="A local helper accepts"
              body="A trusted neighbour picks it up and gets it done — usually within hours."
              icon={<HelpingHand className="w-6 h-6" />}
            />
            <StepCard
              n={3}
              title="Pay only when it's done"
              body="Secure card payment held safely. Released to your helper after completion."
              icon={<ShieldCheck className="w-6 h-6" />}
            />
          </div>
        </section>

        {/* ── Popular categories ── */}
        <section className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Browse by</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Popular categories</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="font-semibold gap-1.5">
              <Link href="/errands">Browse all <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <CategoryTile icon={<ShoppingBag className="w-5 h-5" />} label="Shopping" />
            <CategoryTile icon={<Pill className="w-5 h-5" />}        label="Pharmacy" />
            <CategoryTile icon={<PawPrint className="w-5 h-5" />}    label="Pet Care" />
            <CategoryTile icon={<Hammer className="w-5 h-5" />}      label="Odd Jobs" />
            <CategoryTile icon={<Truck className="w-5 h-5" />}       label="Delivery" />
            <CategoryTile icon={<Leaf className="w-5 h-5" />}        label="Garden" />
          </div>
        </section>

        {/* ── Recent errands ── */}
        <section className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Right now</p>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Recent Requests</h2>
                {recentErrands && recentErrands.length > 0 && (
                  <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
                    {recentErrands.length}
                  </span>
                )}
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground font-semibold gap-1.5"
              data-testid="btn-view-all"
            >
              <Link href="/errands">View all <ArrowRight className="w-4 h-4" /></Link>
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
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center gap-4 bg-card">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">No recent errands</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Be the first to post a request in your area.</p>
              </div>
              <Button asChild className="rounded-full px-6 mt-2 font-bold">
                <Link href="/errands/new" data-testid="btn-empty-post">Post an Errand</Link>
              </Button>
            </div>
          )}
        </section>

        {/* ── Big CTA banner ── */}
        <section className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 md:p-14 shadow-2xl">
          <div className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-[300px] h-[300px] rounded-full bg-primary/15 blur-3xl" />
          <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> Earn locally
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Got time on your hands?<br />
                <span className="text-primary">Make money helping out.</span>
              </h3>
              <p className="text-background/70 text-base md:text-lg max-w-lg">
                Pick errands that suit your schedule. Get paid securely the same day. No bosses, no shifts — just neighbours helping neighbours.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Button
                asChild
                size="lg"
                className="rounded-full font-bold px-8 h-14 text-base shadow-xl shadow-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform"
              >
                <Link href="/helpers/new">Become a Helper <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ───────────── helper components ───────────── */

function MetricTile({
  label, value, loading, accent = false, isText = false,
}: {
  label: string; value?: number | string; loading: boolean; accent?: boolean; isText?: boolean;
}) {
  return (
    <div
      className={`group rounded-2xl px-5 py-5 flex flex-col gap-1.5 shadow-lg transition-transform hover:-translate-y-1 ${
        accent ? "bg-primary" : "bg-foreground"
      }`}
    >
      <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
        accent ? "text-primary-foreground/70" : "text-background/55"
      }`}>
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-9 w-16 bg-white/20 rounded" />
      ) : (
        <p className={`font-sans font-extrabold tracking-tight ${isText ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"} ${
          accent ? "text-primary-foreground" : "text-background"
        }`}>
          {value !== undefined ? value : (isText ? "—" : "0")}
        </p>
      )}
    </div>
  );
}

function StepCard({ n, title, body, icon }: { n: number; title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-200">
      <div className="absolute -top-4 left-6 w-9 h-9 rounded-full bg-foreground text-primary font-extrabold flex items-center justify-center text-sm shadow-lg">
        {n}
      </div>
      <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4 mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="font-extrabold text-lg leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

function CategoryTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={`/errands?category=${encodeURIComponent(label)}`}
      className="group flex flex-col items-center justify-center gap-2 bg-card border border-border rounded-2xl px-4 py-5 hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="w-11 h-11 rounded-xl bg-muted text-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}
