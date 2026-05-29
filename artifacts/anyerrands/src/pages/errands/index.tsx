import { useState } from "react";
import { useListErrands, useListCategories, ErrandStatus } from "@workspace/api-client-react";
import { ErrandCard } from "@/components/errand-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const STATUS_OPTIONS = [
  { label: "Open", value: ErrandStatus.open },
  { label: "All", value: "all" },
  { label: "In Progress", value: ErrandStatus.accepted },
  { label: "Completed", value: ErrandStatus.completed },
];

export default function ErrandsPage() {
  const [status, setStatus] = useState<ErrandStatus | "all">(ErrandStatus.open);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showBudget, setShowBudget] = useState(false);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const { data: errands, isLoading } = useListErrands({
    status: status !== "all" ? status : undefined,
    category: category !== "all" ? category : undefined,
  });
  const { data: categories } = useListCategories();

  const filteredErrands = errands?.filter(e => {
    const matchesSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.requesterLocation.toLowerCase().includes(search.toLowerCase());
    const budget = e.budgetAmount ?? null;
    const aboveMin = minBudget === "" || budget === null || budget >= Number(minBudget);
    const belowMax = maxBudget === "" || budget === null || budget <= Number(maxBudget);
    return matchesSearch && aboveMin && belowMax;
  }).sort((a, b) => {
    // Open errands first, then newest first within each group.
    if (a.status === ErrandStatus.open && b.status !== ErrandStatus.open) return -1;
    if (a.status !== ErrandStatus.open && b.status === ErrandStatus.open) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hasFilters = status !== ErrandStatus.open || category !== "all" || search !== "" || minBudget !== "" || maxBudget !== "";

  const reset = () => {
    setStatus(ErrandStatus.open);
    setCategory("all");
    setSearch("");
    setMinBudget("");
    setMaxBudget("");
    setShowBudget(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8">

      {/* Page heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight">Browse Errands</h1>
          <p className="text-muted-foreground mt-1">Find ways to help out in your community.</p>
        </div>
        <Button asChild size="sm" className="rounded-full shrink-0 hidden sm:flex">
          <Link href="/errands/new">+ Post an Errand</Link>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Search + budget toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search errands or location…"
              className="pl-9 bg-card border-border h-10 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-errands"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant={showBudget ? "default" : "outline"}
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
            onClick={() => setShowBudget(v => !v)}
            title="Budget filter"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-10 rounded-xl text-muted-foreground hover:text-foreground gap-1.5 px-3" data-testid="btn-clear-filters">
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Budget row (expandable) */}
        {showBudget && (
          <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl">
            <span className="text-sm font-medium text-muted-foreground shrink-0">Budget</span>
            <div className="relative w-24">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
              <Input type="number" min={0} placeholder="Min" className="pl-6 h-8 text-sm rounded-lg" value={minBudget} onChange={e => setMinBudget(e.target.value)} data-testid="input-min-budget" />
            </div>
            <span className="text-muted-foreground text-sm">–</span>
            <div className="relative w-24">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
              <Input type="number" min={0} placeholder="Max" className="pl-6 h-8 text-sm rounded-lg" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} data-testid="input-max-budget" />
            </div>
          </div>
        )}

        {/* Status + category pills — horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide flex-nowrap sm:flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value as ErrandStatus | "all")}
              data-testid={`filter-status-${opt.value}`}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border",
                status === opt.value
                  ? "bg-foreground text-background border-transparent"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {opt.label}
            </button>
          ))}

          {/* Divider */}
          <span className="shrink-0 w-px h-5 bg-border mx-1" />

          {/* Category pills */}
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border",
              category === "all"
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            All categories
          </button>
          {categories?.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.name)}
              data-testid={`filter-cat-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border",
                category === c.name
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredErrands && filteredErrands.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground -mb-2">
            {filteredErrands.length} errand{filteredErrands.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredErrands.map(errand => (
              <ErrandCard key={errand.id} errand={errand} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-lg font-bold">
              {status === ErrandStatus.open && !hasFilters ? "No open errands right now" : "No errands found"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {status === ErrandStatus.open && !hasFilters
                ? "Check back soon — new errands appear here as neighbours post them."
                : hasFilters
                  ? "Try adjusting your filters."
                  : "No errands posted yet."}
            </p>
          </div>
          {status === ErrandStatus.open && !hasFilters ? (
            <Button variant="outline" size="sm" onClick={() => setStatus("all")} className="rounded-full">
              View all errands
            </Button>
          ) : hasFilters && (
            <Button variant="outline" size="sm" onClick={reset} className="rounded-full">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
