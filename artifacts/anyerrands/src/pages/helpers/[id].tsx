import { useLocation, useParams } from "wouter";
import { useGetHelper, useGetHelperErrands, getGetHelperQueryKey, getGetHelperErrandsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrandCard } from "@/components/errand-card";
import { format } from "date-fns";
import { MapPin, Star, CheckCircle2, ArrowLeft, CalendarDays } from "lucide-react";

export default function HelperProfilePage() {
  const { id } = useParams<{ id: string }>();
  const helperId = parseInt(id, 10);
  const [, setLocation] = useLocation();

  const { data: helper, isLoading: helperLoading, error } = useGetHelper(helperId, { 
    query: { enabled: !isNaN(helperId), queryKey: getGetHelperQueryKey(helperId) } 
  });
  
  const { data: errands, isLoading: errandsLoading } = useGetHelperErrands(helperId, {
    query: { enabled: !isNaN(helperId), queryKey: getGetHelperErrandsQueryKey(helperId) }
  });

  if (isNaN(helperId) || error) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-8 text-center pt-24">
        <h1 className="text-2xl font-bold mb-4">Helper not found</h1>
        <Button onClick={() => setLocation("/helpers")} variant="outline">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Helpers
        </Button>
      </div>
    );
  }

  if (helperLoading || !helper) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Card>
          <CardContent className="p-8 flex gap-8">
            <Skeleton className="w-32 h-32 rounded-full shrink-0" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 pb-20">
      <Button variant="ghost" onClick={() => setLocation("/helpers")} className="-ml-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to all helpers
      </Button>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-32 bg-secondary/30 relative"></div>
        <CardContent className="p-6 md:p-8 relative pt-0">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <Avatar className="w-32 h-32 border-4 border-card -mt-16 bg-card shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-serif">
                {helper.avatarInitials || helper.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4 mt-2 md:mt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-foreground">{helper.name}</h1>
                  <div className="flex items-center text-muted-foreground mt-2 gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {helper.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" /> Joined {format(new Date(helper.createdAt), "MMMM yyyy")}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col gap-3 md:items-end">
                  {helper.available ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Available to help</Badge>
                  ) : (
                    <Badge variant="secondary" className="font-normal">Not available right now</Badge>
                  )}
                  {helper.rating ? (
                    <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <Star className="w-5 h-5 fill-amber-500" />
                      {helper.rating.toFixed(1)} Rating
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <h3 className="font-medium text-foreground mb-2">About Me</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {helper.bio}
                </p>
              </div>

              <div className="pt-4">
                <h3 className="font-medium text-foreground mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {helper.skills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-muted/30 px-3 py-1 font-normal text-sm border-border/60">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border/60 pb-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-serif font-bold">Errand History</h2>
          <Badge variant="secondary" className="ml-2 rounded-full">{helper.errandsCompleted} completed</Badge>
        </div>

        {errandsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : errands && errands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {errands.map(errand => (
              <ErrandCard key={errand.id} errand={errand} />
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-foreground mb-1">No history yet</p>
              <p>This helper hasn't accepted any errands yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}