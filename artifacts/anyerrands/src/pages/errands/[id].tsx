import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { 
  useGetErrand, 
  useAcceptErrand, 
  useCompleteErrand, 
  useListHelpers,
  ErrandStatus,
  getGetErrandQueryKey,
  getListErrandsQueryKey,
  getGetErrandStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Clock, 
  Euro, 
  User, 
  CalendarDays, 
  CheckCircle2, 
  ArrowLeft,
  Info,
  CreditCard,
  Loader2
} from "lucide-react";

import { useStripeCheckout } from "@/hooks/use-stripe-checkout";

export default function ErrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const errandId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { redirectToCheckout, isPending: isCheckoutPending } = useStripeCheckout();
  
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [selectedHelperId, setSelectedHelperId] = useState<string>("");

  const { data: errand, isLoading, error } = useGetErrand(errandId, { 
    query: { 
      enabled: !isNaN(errandId), 
      queryKey: getGetErrandQueryKey(errandId) 
    } 
  });

  const { data: helpers } = useListHelpers();
  
  const acceptErrand = useAcceptErrand();
  const completeErrand = useCompleteErrand();

  if (isNaN(errandId) || error) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-8 text-center pt-24">
        <h1 className="text-2xl font-bold mb-4">Errand not found</h1>
        <Button onClick={() => setLocation("/errands")} variant="outline">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Errands
        </Button>
      </div>
    );
  }

  if (isLoading || !errand) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/4 mb-8" />
        <Card>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAccept = () => {
    if (!selectedHelperId) {
      toast({
        title: "Please select a helper",
        variant: "destructive"
      });
      return;
    }
    
    acceptErrand.mutate(
      { id: errandId, data: { helperId: parseInt(selectedHelperId, 10) } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetErrandQueryKey(errandId), updated);
          queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
          setIsAcceptOpen(false);
          toast({ title: "Errand accepted!", description: "You are now assigned to this errand." });
        },
        onError: () => {
          toast({ title: "Failed to accept", variant: "destructive" });
        }
      }
    );
  };

  const handleComplete = () => {
    completeErrand.mutate(
      { id: errandId },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetErrandQueryKey(errandId), updated);
          queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
          toast({ title: "Errand completed!", description: "Thanks for helping out the community." });
        },
        onError: () => {
          toast({ title: "Failed to complete", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = () => {
    switch (errand.status) {
      case ErrandStatus.open: 
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-sm py-1 px-3">Open Request</Badge>;
      case ErrandStatus.accepted: 
        return <Badge className="bg-amber-100 text-amber-800 text-sm py-1 px-3">In Progress</Badge>;
      case ErrandStatus.completed: 
        return <Badge className="bg-green-100 text-green-800 text-sm py-1 px-3">Completed</Badge>;
      default: 
        return <Badge variant="outline">{errand.status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 pb-20">
      <Button variant="ghost" onClick={() => setLocation("/errands")} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to all errands
      </Button>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {getStatusBadge()}
          <Badge variant="secondary" className="text-sm py-1 px-3 font-normal">{errand.category}</Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
          {errand.title}
        </h1>
        <div className="flex items-center text-muted-foreground gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>Posted by <span className="font-medium text-foreground">{errand.requesterName}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            <span>{format(new Date(errand.createdAt), "MMMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" /> Details
                </h3>
                <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {errand.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {errand.status !== ErrandStatus.open && (
            <Card className="border-border/60 shadow-sm bg-muted/30">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Helper Assignment</h3>
                {errand.helperName ? (
                  <p className="text-muted-foreground">Assigned to: <span className="font-medium text-foreground">{errand.helperName}</span></p>
                ) : (
                  <p className="text-muted-foreground italic">Helper info unavailable</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm sticky top-6">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <h3 className="font-semibold">At a glance</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Location</p>
                  <p className="text-foreground">{errand.requesterLocation}</p>
                </div>
              </div>
              
              {errand.estimatedDuration && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Duration</p>
                    <p className="text-foreground">{errand.estimatedDuration}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Euro className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Budget</p>
                  <p className="text-foreground font-medium">
                    {errand.budgetAmount != null ? `€${errand.budgetAmount}` : "Volunteer / Unpaid"}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 space-y-3">
                {errand.status === ErrandStatus.open && (
                  <Button 
                    className="w-full rounded-full" 
                    size="lg" 
                    onClick={() => setIsAcceptOpen(true)}
                    data-testid="btn-accept-errand"
                  >
                    I can help with this
                  </Button>
                )}

                {errand.status === ErrandStatus.accepted && (
                  <>
                    {errand.budgetAmount != null && Number(errand.budgetAmount) > 0 && (
                      <>
                        <Button
                          className="w-full rounded-full"
                          size="lg"
                          onClick={() => redirectToCheckout(errandId)}
                          disabled={isCheckoutPending}
                          data-testid="btn-pay-errand"
                        >
                          {isCheckoutPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
                          ) : (
                            <><CreditCard className="w-4 h-4 mr-2" /> Pay €{errand.budgetAmount}</>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          90% goes to the helper · 10% platform fee
                        </p>
                      </>
                    )}
                    <Button 
                      className="w-full rounded-full" 
                      size="lg" 
                      variant="outline"
                      onClick={handleComplete}
                      disabled={completeErrand.isPending}
                      data-testid="btn-complete-errand"
                    >
                      {completeErrand.isPending ? "Marking..." : "Mark as Completed"}
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}

                {errand.status === ErrandStatus.completed && (
                  <div className="flex items-center justify-center gap-2 text-green-600 font-medium py-2 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" /> This errand is done!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this Errand</DialogTitle>
            <DialogDescription>
              Select your helper profile to claim this errand. 
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <Label htmlFor="helper-select" className="mb-2 block">Who is helping?</Label>
            <Select value={selectedHelperId} onValueChange={setSelectedHelperId}>
              <SelectTrigger id="helper-select" data-testid="select-helper-accept">
                <SelectValue placeholder="Select a helper profile" />
              </SelectTrigger>
              <SelectContent>
                {helpers?.map(h => (
                  <SelectItem key={h.id} value={h.id.toString()}>
                    {h.name} - {h.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!helpers?.length && (
              <p className="text-sm text-amber-600 mt-2">
                No helpers found. Please register as a helper first.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAccept} 
              disabled={acceptErrand.isPending || !selectedHelperId}
              data-testid="btn-confirm-accept"
            >
              {acceptErrand.isPending ? "Accepting..." : "Confirm & Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}