import { Link } from "wouter";
import { Helper } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, CheckCircle2 } from "lucide-react";

export function HelperCard({ helper }: { helper: Helper }) {
  return (
    <Link href={`/helpers/${helper.id}`} data-testid={`card-helper-${helper.id}`}>
      <Card className="hover:shadow-md transition-all duration-300 cursor-pointer h-full border border-border hover:border-primary/30 rounded-lg group">
        <CardContent className="p-5 flex flex-col h-full gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border border-border/50 shadow-xs">
                <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-lg font-bold font-sans">
                  {helper.avatarInitials || helper.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-sans text-[17px] font-bold text-foreground group-hover:text-primary transition-colors">{helper.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {helper.location}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {helper.rating ? (
                <div className="flex items-center gap-1 bg-foreground text-background px-2 py-0.5 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {helper.rating.toFixed(1)}
                </div>
              ) : null}
              {helper.available ? (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Available
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span> Busy
                </span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed flex-1">
            {helper.bio}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/60">
            {helper.skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="secondary" className="font-medium bg-muted text-muted-foreground rounded text-[10px] px-2 py-0">
                {skill}
              </Badge>
            ))}
            {helper.skills.length > 3 && (
              <Badge variant="outline" className="font-medium border-dashed rounded text-[10px] px-2 py-0">
                +{helper.skills.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground/40" />
              <span><span className="font-semibold text-foreground">{helper.errandsCompleted}</span> errands done</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}