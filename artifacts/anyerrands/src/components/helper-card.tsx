import { Link } from "wouter";
import { Helper } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function HelperCard({ helper }: { helper: Helper }) {
  const initials = helper.avatarInitials || helper.name.substring(0, 2).toUpperCase();

  return (
    <Link href={`/helpers/${helper.id}`} data-testid={`card-helper-${helper.id}`}>
      <div className="group flex flex-col h-full bg-card border border-border rounded-2xl p-5 gap-4 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 shrink-0 ring-2 ring-primary/30">
              <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors duration-150 truncate">
                {helper.name}
              </h3>
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{helper.location}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {helper.rating != null && (
              <span className="flex items-center gap-1 bg-foreground text-background text-xs font-semibold px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-primary text-primary" />
                {helper.rating.toFixed(1)}
              </span>
            )}
            <span className={cn(
              "flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide",
              helper.available ? "text-emerald-600" : "text-muted-foreground"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", helper.available ? "bg-emerald-500" : "bg-muted-foreground/30")} />
              {helper.available ? "Available" : "Busy"}
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {helper.bio}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {helper.skills.slice(0, 3).map((skill, i) => (
            <span key={i} className="text-[11px] font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
          {helper.skills.length > 3 && (
            <span className="text-[11px] font-medium border border-border text-muted-foreground px-2.5 py-0.5 rounded-full">
              +{helper.skills.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-foreground/30" />
          <span><span className="font-semibold text-foreground">{helper.errandsCompleted}</span> errands done</span>
        </div>
      </div>
    </Link>
  );
}
