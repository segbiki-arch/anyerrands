import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Errand, ErrandStatus } from "@workspace/api-client-react";
import { MapPin, Clock, Car, ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { requesterAvatarUrl } from "@/lib/avatars";

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
      <div className="group relative flex flex-col h-full bg-card border border-border rounded-2xl p-5 gap-4 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden">
        {/* hover glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/0 group-hover:bg-primary/20 blur-3xl transition-colors duration-300" />

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
          {errand.tripFrom && errand.tripTo && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground bg-primary/10 rounded-lg px-2.5 py-1.5 w-fit max-w-full">
              <Car className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{errand.tripFrom}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate">{errand.tripTo}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {errand.description}
          </p>
          {errand.status !== ErrandStatus.open && errand.helperName && (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-foreground/5 rounded-lg px-2.5 py-1.5 w-fit max-w-full"
              data-testid={`errand-assignee-${errand.id}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">
                {errand.status === ErrandStatus.completed ? "Completed by" : "Assigned to"} {errand.helperName}
              </span>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[110px]">{errand.tripWhen ?? errand.requesterLocation}</span>
          </span>
          {errand.passengers != null && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 shrink-0" />
              {errand.passengers}
            </span>
          )}
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
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 -mt-1">
          <span className="flex items-center gap-1.5 font-medium">
            <img
              src={requesterAvatarUrl(errand.requesterName, 40)}
              alt=""
              aria-hidden
              className="w-5 h-5 rounded-full ring-1 ring-border"
            />
            {errand.requesterName}
          </span>
          <span>{formatDistanceToNow(new Date(errand.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}
