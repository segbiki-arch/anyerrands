import { useState } from "react";
import { useListErrands, useListCategories, ErrandStatus } from "@workspace/api-client-react";
import { ErrandCard } from "@/components/errand-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FilterX, Euro } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ErrandsPage() {
  const [status, setStatus] = useState<ErrandStatus | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const { data: errands, isLoading } = useListErrands({
    status: status !== "all" ? status : undefined,
    category: category !== "all" ? category : undefined,
  });

  const { data: categories } = useListCategories();

  const filteredErrands = errands?.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.requesterLocation.toLowerCase().includes(search.toLowerCase());
    const budget = e.budgetAmount ?? null;
    const aboveMin = minBudget === "" || budget === null || budget >= Number(minBudget);
    const belowMax = maxBudget === "" || budget === null || budget <= Number(maxBudget);
    return matchesSearch && aboveMin && belowMax;
  });

  const resetFilters = () => {
    setStatus("all");
    setCategory("all");
    setSearch("");
    setMinBudget("");
    setMaxBudget("");
  };

  const hasFilters = status !== "all" || category !== "all" || search !== "" || minBudget !== "" || maxBudget !== "";

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Browse Errands</h1>
        <p className="text-lg text-muted-foreground">Find ways to help out in your community.</p>
      </div>

      <div className="flex flex-col gap-4 p-4 bg-card border border-border/60 rounded-xl shadow-xs">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by keyword or location..."
              className="pl-9 bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-errands"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[200px] bg-background/50" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as ErrandStatus | "all")}>
            <SelectTrigger className="w-full md:w-[160px] bg-background/50" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={ErrandStatus.open}>Open</SelectItem>
              <SelectItem value={ErrandStatus.accepted}>Accepted</SelectItem>
              <SelectItem value={ErrandStatus.completed}>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 border-t border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <Euro className="w-4 h-4" />
            <span className="font-medium">Budget range</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              <Input
                type="number"
                min={0}
                placeholder="Min"
                className="pl-7 bg-background/50 h-9 text-sm"
                value={minBudget}
                onChange={e => setMinBudget(e.target.value)}
                data-testid="input-min-budget"
              />
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                className="pl-7 bg-background/50 h-9 text-sm"
                value={maxBudget}
                onChange={e => setMaxBudget(e.target.value)}
                data-testid="input-max-budget"
              />
            </div>
            <span className="text-xs text-muted-foreground italic hidden sm:block">Leave blank for any</span>
          </div>
          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters} className="shrink-0 text-muted-foreground hover:text-foreground ml-auto" data-testid="btn-clear-filters">
              <FilterX className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredErrands && filteredErrands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredErrands.map(errand => (
            <ErrandCard key={errand.id} errand={errand} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border border-border/60 border-dashed rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No errands found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We couldn't find any errands matching your current filters. Try adjusting them or check back later.
          </p>
          {hasFilters && (
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}