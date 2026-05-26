import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Errand, ErrandStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Euro, ArrowRight } from "lucide-react";

export function ErrandCard({ errand }: { errand: Errand }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case ErrandStatus.open: return "bg-primary text-primary-foreground border-transparent";
      case ErrandStatus.accepted: return "bg-blue-500 text-white border-transparent";
      case ErrandStatus.completed: return "bg-green-500 text-white border-transparent";
      default: return "bg-muted text-muted-foreground border-transparent";
    }
  };

  return (
    <Link href={`/errands/${errand.id}`} data-testid={`card-errand-${errand.id}`}>
      <Card className="flex flex-col h-full bg-card hover:shadow-md transition-all duration-300 border border-border hover:border-primary/30 cursor-pointer rounded-lg group">
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex justify-between items-start gap-4">
            <Badge variant="secondary" className="font-medium rounded-full bg-foreground text-background shrink-0 px-2.5 py-0.5 text-xs">
              {errand.category}
            </Badge>
            <Badge className={`font-medium rounded-full px-2.5 py-0.5 text-xs capitalize ${getStatusColor(errand.status)}`} variant="outline">
              {errand.status}
            </Badge>
          </div>
          
          <div className="flex-1">
            <h3 className="text-[17px] font-sans font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors" title={errand.title}>
              {errand.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2" title={errand.description}>
              {errand.description}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-4 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{errand.requesterLocation}</span>
            </div>
            
            {errand.estimatedDuration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{errand.estimatedDuration}</span>
              </div>
            )}
            
            {errand.budgetAmount != null && (
              <div className="flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">€{errand.budgetAmount}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">{errand.requesterName}</span>
              <span className="text-[11px] text-muted-foreground/70">{formatDistanceToNow(new Date(errand.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
              Details <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}