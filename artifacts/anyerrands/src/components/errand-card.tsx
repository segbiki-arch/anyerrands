import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Errand, ErrandStatus } from "@workspace/api-client-react";
import { MapPin, Clock, Euro } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  [ErrandStatus.open]: "bg-primary text-primary-foreground",
  [ErrandStatus.accepted]: "bg-foreground text-background",
  [ErrandStatus.completed]: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  [ErrandStatus.open]: "Open",
  [ErrandStatus.accepted]: "In Progress",
  [ErrandStatus.completed]: "Done",
};

export function ErrandCard({ errand }: { errand: Errand }) {
  const statusStyle = STATUS_STYLES[errand.status] ?? "bg-muted text-muted-foreground";
  const statusLabel = STATUS_LABELS[errand.status] ?? errand.status;

  return (
    <Link href={`/errands/${errand.id}`} data-testid={`card-errand-${errand.id}`}>
      <div className="group relative flex flex-col h-full bg-card border border-border rounded-xl p-5 gap-4 hover:border-foreground/20 hover:shadow-md transition-all duration-200 cursor-pointer">

        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold bg-foreground text-background px-2.5 py-1 rounded-full truncate max-w-[60%]">
            {errand.category}
          </span>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", statusStyle)}>
            {statusLabel}
          </span>
        </div>

        {/* Title + description */}
        <div className="flex-1 space-y-1.5 min-h-0">
          <h3 className="text-[15px] font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-150">
            {errand.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {errand.description}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[110px]">{errand.requesterLocation}</span>
          </span>
          {errand.estimatedDuration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" />
              {errand.estimatedDuration}
            </span>
          )}
          {errand.budgetAmount != null && (
            <span className="flex items-center gap-1 ml-auto font-bold text-foreground text-sm">
              €{errand.budgetAmount}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 -mt-1">
          <span className="font-medium">{errand.requesterName}</span>
          <span>{formatDistanceToNow(new Date(errand.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}
