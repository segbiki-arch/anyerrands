import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetHelper,
  useGetHelperErrands,
  useStripeConnectOnboard,
  useStripeConnectManage,
  useStripeConnectStatus,
  getGetHelperQueryKey,
  getGetHelperErrandsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { helperPhotoUrl } from "@/lib/avatars";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrandCard } from "@/components/errand-card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  MapPin, Star, CheckCircle2, ArrowLeft, CalendarDays,
  Banknote, ExternalLink, AlertCircle, Loader2, ShieldCheck
} from "lucide-react";

export default function HelperProfilePage() {
  const { id } = useParams<{ id: string }>();
  const helperId = parseInt(id, 10);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: helper, isLoading: helperLoading, error } = useGetHelper(helperId, {
    query: { enabled: !isNaN(helperId), queryKey: getGetHelperQueryKey(helperId) }
  });

  const { data: errands, isLoading: errandsLoading } = useGetHelperErrands(helperId, {
    query: { enabled: !isNaN(helperId), queryKey: getGetHelperErrandsQueryKey(helperId) }
  });

  const { data: connectStatus, isLoading: statusLoading, refetch: refetchStatus } = useStripeConnectStatus(helperId, {
    query: { enabled: !isNaN(helperId) }
  });

  const onboard = useStripeConnectOnboard();
  const manage = useStripeConnectManage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "success") {
      toast({ title: "Bank account connected!", description: "You're ready to receive payments for errands." });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: getGetHelperQueryKey(helperId) });
      setLocation(`/helpers/${helperId}`, { replace: true });
    } else if (params.get("connect") === "refresh") {
      toast({ title: "Continue setup", description: "Please complete your bank account setup.", variant: "destructive" });
      setLocation(`/helpers/${helperId}`, { replace: true });
    }
  }, []);

  const handleConnectStripe = () => {
    onboard.mutate({ helperId }, {
      onSuccess: ({ url }) => { window.location.href = url; },
      onError: () => toast({ title: "Failed to start setup", description: "Please try again.", variant: "destructive" }),
    });
  };

  const handleManageStripe = () => {
    manage.mutate({ helperId }, {
      onSuccess: ({ url }) => { window.location.href = url; },
      onError: () => toast({ title: "Couldn't open bank settings", description: "Please try again.", variant: "destructive" }),
    });
  };

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
        <Card><CardContent className="p-8 flex gap-8">
          <Skeleton className="w-32 h-32 rounded-full shrink-0" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent></Card>
      </div>
    );
  }

  const isConnected = connectStatus?.chargesEnabled === true;
  const isPending = connectStatus?.connected && !connectStatus?.chargesEnabled;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 pb-20">
      <Button variant="ghost" onClick={() => setLocation("/helpers")} className="-ml-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to all helpers
      </Button>

      {/* Profile card */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-28 bg-foreground relative" />
        <CardContent className="p-6 md:p-8 relative pt-0">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <Avatar className="w-28 h-28 border-4 border-card -mt-14 bg-card shrink-0">
              <AvatarImage src={helperPhotoUrl(helper.id, 320)} alt={helper.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                {helper.avatarInitials || helper.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 mt-2 md:mt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{helper.name}</h1>
                  <div className="flex items-center text-muted-foreground mt-2 gap-4 flex-wrap text-sm">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{helper.location}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />Joined {format(new Date(helper.createdAt), "MMMM yyyy")}</span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 md:items-end">
                  {helper.available ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Available to help</Badge>
                  ) : (
                    <Badge variant="secondary" className="font-normal">Not available right now</Badge>
                  )}
                  {helper.rating != null && (
                    <div className="flex items-center gap-1.5 text-amber-600 font-medium text-sm">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {helper.rating.toFixed(1)} Rating
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <h3 className="font-medium text-foreground mb-2">About Me</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{helper.bio}</p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {helper.skills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-muted/30 px-3 py-1 font-normal text-sm border-border/60">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connect payout section */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Payout Account</h2>
          </div>

          {statusLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Checking account status…</div>
          ) : isConnected ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Bank account connected</p>
                  <p className="text-sm text-green-700 mt-0.5">
                    You'll automatically receive <span className="font-bold">90%</span> of each errand payment directly to your bank. AnyErrands keeps 10%.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageStripe}
                disabled={manage.isPending}
                className="rounded-full shrink-0 gap-2 border-green-300 bg-white/60 text-green-800 hover:bg-white hover:text-green-900"
                data-testid="btn-manage-bank"
              >
                {manage.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Opening…</> : <><ExternalLink className="w-3.5 h-3.5" />Update bank details</>}
              </Button>
            </div>
          ) : isPending ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800">Setup incomplete</p>
                <p className="text-sm text-amber-700 mt-0.5 mb-3">Stripe needs a bit more information before you can receive payments.</p>
                <Button size="sm" onClick={handleConnectStripe} disabled={onboard.isPending} className="rounded-full gap-2">
                  {onboard.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</> : <><ExternalLink className="w-3.5 h-3.5" />Complete Setup</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
              <div>
                <p className="font-semibold text-foreground">Connect your bank account</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get paid automatically — you receive <span className="font-semibold text-foreground">90%</span> of every errand. AnyErrands takes 10%.
                </p>
              </div>
              <Button onClick={handleConnectStripe} disabled={onboard.isPending} className="rounded-full shrink-0 gap-2">
                {onboard.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Loading…</> : <><Banknote className="w-4 h-4" />Connect Bank Account</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errand history */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border/60 pb-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Errand History</h2>
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
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl text-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30" />
            <div>
              <p className="text-lg font-medium text-foreground">No history yet</p>
              <p className="text-sm text-muted-foreground">This helper hasn't accepted any errands yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
