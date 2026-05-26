import { useState } from "react";
import { useListHelpers } from "@workspace/api-client-react";
import { HelperCard } from "@/components/helper-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";

export default function HelpersPage() {
  const [search, setSearch] = useState("");
  const { data: helpers, isLoading } = useListHelpers();

  const filteredHelpers = helpers?.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.location.toLowerCase().includes(search.toLowerCase()) ||
    h.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Community Helpers</h1>
        <p className="text-lg text-muted-foreground">Meet the neighbors who make things happen.</p>
      </div>

      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, location, or skill..." 
          className="pl-9 bg-card border-border/60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-helpers"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredHelpers && filteredHelpers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredHelpers.map(helper => (
            <HelperCard key={helper.id} helper={helper} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border border-border/60 border-dashed rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No helpers found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {search ? "No helpers match your search terms." : "No helpers have registered yet."}
          </p>
        </div>
      )}
    </div>
  );
}