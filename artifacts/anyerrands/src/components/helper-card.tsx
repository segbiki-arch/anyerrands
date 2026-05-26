import { Link } from "wouter";
import { Helper } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, CheckCircle2 } from "lucide-react";

export function HelperCard({ helper }: { helper: Helper }) {
  return (
    <Link href={`/helpers/${helper.id}`} data-testid={`card-helper-${helper.id}`}>
      <Card className="hover-elevate transition-all cursor-pointer h-full border-border/60 shadow-sm hover:border-primary/30">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/5 text-primary text-xl font-serif">
                  {helper.avatarInitials || helper.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-serif text-xl font-bold text-foreground">{helper.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {helper.location}
                </div>
              </div>
            </div>
            
            {helper.rating ? (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-sm font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {helper.rating.toFixed(1)}
              </div>
            ) : null}
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2">
            {helper.bio}
          </p>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            {helper.skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="secondary" className="font-normal bg-secondary/50 hover:bg-secondary">
                {skill}
              </Badge>
            ))}
            {helper.skills.length > 3 && (
              <Badge variant="outline" className="font-normal border-dashed">
                +{helper.skills.length - 3} more
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="font-medium text-foreground">{helper.errandsCompleted}</span> errands done
            </div>
            {helper.available ? (
              <span className="flex items-center gap-1.5 text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Available
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40"></span> Busy
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}