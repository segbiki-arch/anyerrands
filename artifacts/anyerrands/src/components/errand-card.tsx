import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Errand, ErrandStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Euro } from "lucide-react";

export function ErrandCard({ errand }: { errand: Errand }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case ErrandStatus.open: return "bg-primary/10 text-primary hover:bg-primary/20";
      case ErrandStatus.accepted: return "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case ErrandStatus.completed: return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="flex flex-col h-full hover-elevate transition-all duration-300 border-border/60 shadow-sm" data-testid={`card-errand-${errand.id}`}>
      <CardHeader className="pb-4 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <Badge variant="secondary" className="font-normal rounded-md shrink-0">
            {errand.category}
          </Badge>
          <Badge className={`font-normal rounded-md shadow-none capitalize ${getStatusColor(errand.status)}`} variant="outline">
            {errand.status}
          </Badge>
        </div>
        <div>
          <h3 className="text-xl font-serif font-bold line-clamp-2" title={errand.title}>
            {errand.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2" title={errand.description}>
            {errand.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3 pb-6">
        <div className="flex items-center text-sm text-foreground/80 gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="truncate">{errand.requesterLocation}</span>
        </div>
        
        {errand.estimatedDuration && (
          <div className="flex items-center text-sm text-foreground/80 gap-2">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{errand.estimatedDuration}</span>
          </div>
        )}
        
        {errand.budgetAmount != null && (
          <div className="flex items-center text-sm text-foreground/80 gap-2">
            <Euro className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium">€{errand.budgetAmount}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 border-t border-border/40 bg-muted/20 px-6 py-4 mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Posted by {errand.requesterName}</span>
          <span className="text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(errand.createdAt), { addSuffix: true })}</span>
        </div>
        <Button asChild size="sm" variant={errand.status === ErrandStatus.open ? "default" : "secondary"}>
          <Link href={`/errands/${errand.id}`} data-testid={`btn-view-errand-${errand.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}