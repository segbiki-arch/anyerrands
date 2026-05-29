import { Link } from "wouter";
import { useGetErrandStats, useGetRecentErrands } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrandCard } from "@/components/errand-card";
import {
  ArrowRight,
  ClipboardList,
  ShoppingBag,
  PawPrint,
  Pill,
  Hammer,
  Truck,
  Leaf,
  HelpingHand,
  ShieldCheck,
  MapPin,
  Car,
} from "lucide-react";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetErrandStats();
  const { data: recentErrands, isLoading: errandsLoading } = useGetRecentErrands({ limit: 4 });

  return (
    <div className="flex flex-col bg-background">
      {/* ──────────────── HERO ──────────────── */}
      <section className="relative w-full bg-white overflow-hidden border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center justify-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground text-sm font-medium px-4 py-2 rounded-full shadow-sm animate-fade-down">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
            </span>
            Nenagh, Co. Tipperary
          </div>

          <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-foreground leading-[1.1]">
              Need a hand with something?
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ask your neighbours to pick up the shopping, help with a small job, or give you a lift into town.
            </p>
            <p className="text-base sm:text-lg font-serif italic text-foreground/70 max-w-2xl mx-auto pt-2">
              Creating trusted community micro-helping.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:150ms] pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full font-bold px-10 h-16 text-lg shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all"
              data-testid="btn-hero-post"
            >
              <Link href="/errands/new">Ask for help</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full font-bold px-10 h-16 text-lg border-2 border-border hover:bg-muted hover:scale-105 transition-all"
              data-testid="btn-hero-helper"
            >
              <Link href="/helpers/new">Offer to help</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────── STATS TILES ──────────────── */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricTile label="Requests Open"  value={stats?.totalOpen}      loading={statsLoading} />
          <MetricTile label="Being Helped"   value={stats?.totalAccepted}  loading={statsLoading} />
          <MetricTile label="Jobs Done"     value={stats?.totalCompleted} loading={statsLoading} accent />
          <MetricTile label="Top Need"  value={stats?.topCategory || "—"} loading={statsLoading} isText />
        </div>
      </div>

      {/* ──────────────── MAIN CONTENT ──────────────── */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10 py-12 space-y-24">

        {/* ── Popular categories ── */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Popular right now</h2>
            <Button asChild variant="outline" className="rounded-full font-semibold">
              <Link href="/errands">See all categories <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <CategoryTile icon={<ShoppingBag className="w-6 h-6" />} label="Shopping" />
            <CategoryTile icon={<Pill className="w-6 h-6" />}        label="Pharmacy" />
            <CategoryTile icon={<PawPrint className="w-6 h-6" />}    label="Pet Care" />
            <CategoryTile icon={<Hammer className="w-6 h-6" />}      label="Odd Jobs" />
            <CategoryTile icon={<Truck className="w-6 h-6" />}       label="Delivery" />
            <CategoryTile icon={<Leaf className="w-6 h-6" />}        label="Garden" />
          </div>
        </section>

        {/* ── Lifts / rides banner ── */}
        <section className="relative overflow-hidden rounded-[2rem] bg-white border border-border p-8 md:p-14 shadow-sm hover:shadow-md transition-shadow">
          <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                <Car className="w-4 h-4 text-primary" /> Lifts & Rides
              </div>
              <h3 className="text-3xl md:text-5xl font-serif font-bold tracking-tight leading-tight">
                Heading into town?
              </h3>
              <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
                Need a lift to the airport, or just a spin into Nenagh? Ask for a lift from someone who's already going that way.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Limerick", "Shannon Airport", "Thurles", "Nenagh Town"].map((p) => (
                  <span key={p} className="flex items-center gap-1.5 bg-muted/50 border border-border text-foreground text-sm font-medium px-3 py-1.5 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex md:justify-end">
              <Button
                asChild
                size="lg"
                className="rounded-full font-bold px-8 h-14 text-base shadow-lg bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all"
                data-testid="btn-request-lift"
              >
                <Link href="/lifts/new">Request a Lift <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="space-y-10 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">Helping each other out</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <StepCard
              n={1}
              title="Tell us what you need"
              body="Post your request in seconds. Say what needs doing and what you're happy to pay."
              icon={<ClipboardList className="w-8 h-8" />}
            />
            <StepCard
              n={2}
              title="A neighbour accepts"
              body="Someone local picks it up and gets it sorted for you."
              icon={<HelpingHand className="w-8 h-8" />}
            />
            <StepCard
              n={3}
              title="Pay securely"
              body="Your payment is held safely until the job is fully complete."
              icon={<ShieldCheck className="w-8 h-8" />}
            />
          </div>
        </section>

        {/* ── Recent errands ── */}
        <section className="space-y-8 bg-muted/20 p-8 md:p-12 rounded-[2.5rem]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Latest requests</h2>
              <p className="text-lg text-muted-foreground">Neighbours looking for a hand today.</p>
            </div>
            <Button
              asChild
              className="rounded-full font-semibold px-6"
              data-testid="btn-view-all"
            >
              <Link href="/errands">View all requests</Link>
            </Button>
          </div>

          {errandsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-2xl bg-white/50" />
              ))}
            </div>
          ) : recentErrands && recentErrands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentErrands.map(errand => (
                <ErrandCard key={errand.id} errand={errand} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 border border-border rounded-3xl text-center gap-6 bg-white">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2 max-w-md">
                <p className="text-2xl font-serif font-bold">All caught up</p>
                <p className="text-muted-foreground text-lg">There are no open requests right now. Be the first to ask for a hand.</p>
              </div>
              <Button asChild size="lg" className="rounded-full px-8 mt-2 font-bold shadow-lg">
                <Link href="/errands/new" data-testid="btn-empty-post">Ask for help</Link>
              </Button>
            </div>
          )}
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
      className={`group rounded-3xl p-6 md:p-8 flex flex-col gap-2 transition-all hover:-translate-y-1 ${
        accent ? "bg-primary text-primary-foreground shadow-xl shadow-primary/10" : "bg-white border border-border shadow-sm hover:shadow-md"
      }`}
    >
      <p className={`text-sm font-medium uppercase tracking-wider ${
        accent ? "text-primary-foreground/80" : "text-muted-foreground"
      }`}>
        {label}
      </p>
      {loading ? (
        <Skeleton className={`h-10 w-20 rounded-lg ${accent ? 'bg-primary-foreground/10' : 'bg-muted'}`} />
      ) : (
        <p className={`font-serif font-bold tracking-tight ${isText ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl"} ${
          accent ? "text-primary-foreground" : "text-foreground"
        }`}>
          {value !== undefined ? value : (isText ? "—" : "0")}
        </p>
      )}
    </div>
  );
}

function StepCard({ n, title, body, icon }: { n: number; title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="group relative bg-white border border-border rounded-3xl p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="font-serif font-bold text-2xl mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function CategoryTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={`/errands?category=${encodeURIComponent(label)}`}
      className="group flex flex-col items-center justify-center gap-4 bg-white border border-border rounded-3xl p-6 hover:border-primary/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
        {icon}
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
