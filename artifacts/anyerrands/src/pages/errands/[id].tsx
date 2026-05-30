import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { 
  useGetErrand, 
  useAcceptErrand, 
  useCompleteErrand, 
  useAbortErrand,
  useSetErrandContact,
  useListHelpers,
  useCreateReview,
  ErrandStatus,
  getGetErrandQueryKey,
  getListErrandsQueryKey,
  getGetErrandStatsQueryKey,
  getGetHelperReviewsQueryKey,
  getGetHelperQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MapPin, Clock, Euro, User, CalendarDays, CheckCircle2, ArrowLeft,
  Info, CreditCard, Loader2, Flag, AlertTriangle, MessageCircle, Phone, Lock,
  Car, ArrowRight, Calendar, Users, Star
} from "lucide-react";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";

const REPORT_REASONS = [
  { value: "work_not_done",     label: "Work was not done at all" },
  { value: "work_poor_quality", label: "Work done poorly / unsatisfactorily" },
  { value: "no_show",           label: "Helper didn't show up" },
  { value: "late",              label: "Helper was significantly late" },
  { value: "other",             label: "Other issue" },
];

function toWhatsAppLink(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `353${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export default function ErrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const errandId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { redirectToCheckout, isPending: isCheckoutPending } = useStripeCheckout();
  
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isAbortOpen, setIsAbortOpen] = useState(false);
  const [selectedHelperId, setSelectedHelperId] = useState<string>("");

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const [contactPhone, setContactPhone] = useState("");

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const { data: errand, isLoading, error } = useGetErrand(errandId, { 
    query: {
      enabled: !isNaN(errandId),
      queryKey: getGetErrandQueryKey(errandId),
      // While an errand is accepted (in progress), poll so the helper's view
      // flips from "waiting for confirmation" to "Completed" automatically the
      // moment the requester confirms — no manual refresh needed.
      refetchInterval: (query) =>
        query.state.data?.status === ErrandStatus.accepted ? 5000 : false,
      refetchIntervalInBackground: false,
    },
  });
  const { data: helpers } = useListHelpers();
  const acceptErrand = useAcceptErrand();
  const completeErrand = useCompleteErrand();
  const abortErrand = useAbortErrand();
  const setErrandContact = useSetErrandContact();
  const createReview = useCreateReview();

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
        <Card><CardContent className="p-8 space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent></Card>
      </div>
    );
  }

  const handleAccept = () => {
    if (!selectedHelperId) {
      toast({ title: "Please select a helper", variant: "destructive" });
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
        onError: (e) => {
          const message = (e as { data?: { error?: string } })?.data?.error ?? "Please try again.";
          toast({ title: "Couldn't accept errand", description: message, variant: "destructive" });
        },
      }
    );
  };

  const handleComplete = () => {
    completeErrand.mutate({ id: errandId }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetErrandQueryKey(errandId), updated);
        queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
        toast({ title: "Errand completed!", description: "Thanks for helping out the community." });
      },
      onError: () => toast({ title: "Failed to complete", variant: "destructive" }),
    });
  };

  const handleAbort = () => {
    abortErrand.mutate({ id: errandId }, {
      onSuccess: (updated) => {
        setIsAbortOpen(false);
        queryClient.setQueryData(getGetErrandQueryKey(errandId), updated);
        queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
        toast({
          title: "You've backed out of this job",
          description: "It's open again for someone else, and any payment is refunded to the requester.",
        });
      },
      onError: (e) => {
        const message = (e as { data?: { error?: string } })?.data?.error ?? "Please try again.";
        toast({ title: "Couldn't back out", description: message, variant: "destructive" });
      },
    });
  };

  const handleSaveContact = () => {
    if (contactPhone.trim().length < 5) {
      toast({ title: "Please enter a phone number", variant: "destructive" }); return;
    }
    setErrandContact.mutate(
      { id: errandId, data: { requesterPhone: contactPhone.trim() } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetErrandQueryKey(errandId), updated);
          setContactPhone("");
          toast({ title: "Number shared", description: "Your helper can now WhatsApp or call you." });
        },
        onError: (e) => {
          const message = (e as { data?: { error?: string } })?.data?.error ?? "Please try again.";
          toast({ title: "Couldn't save details", description: message, variant: "destructive" });
        },
      }
    );
  };

  const handleReview = () => {
    if (!reviewerName.trim() || reviewerName.trim().length < 2) {
      toast({ title: "Please enter your name", variant: "destructive" }); return;
    }
    if (reviewRating < 1) {
      toast({ title: "Please choose a star rating", variant: "destructive" }); return;
    }
    createReview.mutate(
      {
        id: errandId,
        data: {
          reviewerName: reviewerName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        },
      },
      {
        onSuccess: (review) => {
          setIsReviewOpen(false);
          setAlreadyReviewed(true);
          setReviewerName(""); setReviewRating(0); setHoverRating(0); setReviewComment("");
          if (errand.helperId) {
            queryClient.invalidateQueries({ queryKey: getGetHelperReviewsQueryKey(errand.helperId) });
            queryClient.invalidateQueries({ queryKey: getGetHelperQueryKey(errand.helperId) });
          }
          void review;
          toast({ title: "Thanks for your review!", description: "Your feedback helps the whole community." });
        },
        onError: (e) => {
          const message = (e as { data?: { error?: string } })?.data?.error ?? "Please try again.";
          if (/already/i.test(message)) setAlreadyReviewed(true);
          toast({ title: "Couldn't submit review", description: message, variant: "destructive" });
        },
      }
    );
  };

  const handleReport = async () => {
    if (!reporterName.trim() || reporterName.trim().length < 2) {
      toast({ title: "Please enter your name", variant: "destructive" }); return;
    }
    if (!reportReason) {
      toast({ title: "Please select a reason", variant: "destructive" }); return;
    }
    if (reportDescription.trim().length < 10) {
      toast({ title: "Please add more detail (at least 10 characters)", variant: "destructive" }); return;
    }
    setIsReporting(true);
    try {
      const res = await fetch(`/api/errands/${errandId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporterName: reporterName.trim(), reason: reportReason, description: reportDescription.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to submit report");
      }
      setIsReportOpen(false);
      setAlreadyReported(true);
      setReporterName(""); setReportReason(""); setReportDescription("");
      toast({ title: "Report submitted", description: "We'll review this and take action if needed. Thank you." });
    } catch (e) {
      toast({ title: "Failed to submit report", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsReporting(false);
    }
  };

  const canReport = (errand.status === ErrandStatus.accepted || errand.status === ErrandStatus.completed) && !!errand.helperId;

  const myHelper = helpers?.find((h) => h.isOwner);
  const isAssignedHelper = !!myHelper && errand.helperId === myHelper.id;

  const isLift = errand.category === "Lifts & Transport";
  const requiresPayment = errand.budgetAmount != null && Number(errand.budgetAmount) > 0;
  const contactUnlocked = errand.paymentStatus === "paid" || !requiresPayment;

  const getStatusBadge = () => {
    switch (errand.status) {
      case ErrandStatus.open:      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-sm py-1 px-3">Open Request</Badge>;
      case ErrandStatus.accepted:  return <Badge className="bg-amber-100 text-amber-800 text-sm py-1 px-3">In Progress</Badge>;
      case ErrandStatus.completed: return <Badge className="bg-green-100 text-green-800 text-sm py-1 px-3">Completed</Badge>;
      default:                     return <Badge variant="outline">{errand.status}</Badge>;
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
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">{errand.title}</h1>
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
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          {errand.status === ErrandStatus.accepted && errand.isRequester && (
            <Card className="border-primary/40 shadow-sm bg-primary/10" data-testid="banner-accepted">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-lg font-bold text-foreground">
                    {errand.helperName ?? "A helper"} accepted your errand!
                  </h3>
                </div>
                <p className="text-sm text-foreground/80">Here's what happens next:</p>
                <ol className="space-y-2 text-sm text-foreground/90">
                  {requiresPayment && (
                    <li className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${errand.paymentStatus === "paid" ? "bg-green-500 text-white" : "bg-foreground text-background"}`}>
                        {errand.paymentStatus === "paid" ? "✓" : "1"}
                      </span>
                      <span>
                        {errand.paymentStatus === "paid"
                          ? "Payment made — held safely until you confirm the job is done."
                          : "Pay securely below. Your money is held safely and only sent to the helper once you confirm the job is done."}
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${errand.requesterPhone ? "bg-green-500 text-white" : "bg-foreground text-background"}`}>
                      {errand.requesterPhone ? "✓" : requiresPayment ? "2" : "1"}
                    </span>
                    <span>
                      {errand.requesterPhone
                        ? `Your number is shared — ${errand.helperName ?? "your helper"} can now WhatsApp or call you.`
                        : `Share your phone number so ${errand.helperName ?? "your helper"} can WhatsApp or call you to sort out the details.`}
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {errand.tripFrom && errand.tripTo && (
            <Card className="border-primary/30 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-primary w-full" />
              <CardContent className="p-6 md:p-8 space-y-5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" /> The Journey
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl font-bold text-foreground">{errand.tripFrom}</span>
                  <ArrowRight className="w-5 h-5 text-primary" />
                  <span className="text-xl font-bold text-foreground">{errand.tripTo}</span>
                  {errand.returnTrip && (
                    <span className="text-xs font-semibold bg-primary/15 text-foreground px-2.5 py-1 rounded-full">Return trip</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  {errand.tripWhen && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">When:</span>
                      <span className="font-medium text-foreground">{errand.tripWhen}</span>
                    </div>
                  )}
                  {errand.passengers != null && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Passengers:</span>
                      <span className="font-medium text-foreground">{errand.passengers}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Details
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">{errand.description}</p>
            </CardContent>
          </Card>

          {errand.status !== ErrandStatus.open && (() => {
            const assignedHelper = errand.helperId != null
              ? helpers?.find((h) => h.id === errand.helperId)
              : undefined;
            const initials = assignedHelper?.avatarInitials
              || (errand.helperName ?? "")
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
            return (
              <Card className="border-border/60 shadow-sm bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Your helper</h3>
                  {errand.helperName ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 font-semibold text-foreground">
                          {initials || <User className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{errand.helperName}</p>
                          {assignedHelper && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {assignedHelper.rating != null && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                                  {assignedHelper.rating.toFixed(1)}
                                </span>
                              )}
                              <span>{assignedHelper.errandsCompleted} errand{assignedHelper.errandsCompleted === 1 ? "" : "s"} done</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {assignedHelper?.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span>{assignedHelper.location}</span>
                        </div>
                      )}
                      {assignedHelper?.bio && (
                        <p className="text-sm text-muted-foreground">{assignedHelper.bio}</p>
                      )}
                      {assignedHelper?.skills && assignedHelper.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedHelper.skills.map((skill) => (
                            <span key={skill} className="text-xs rounded-full bg-primary/10 text-foreground px-2.5 py-0.5">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Helper info unavailable</p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {errand.status === ErrandStatus.accepted && errand.isRequester && !errand.requesterPhone && (
            contactUnlocked ? (
              <Card className="border-primary/30 shadow-sm bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Share your number with {errand.helperName ?? "your helper"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isLift
                        ? `Add your phone number so ${errand.helperName ?? "your driver"} can WhatsApp or call you to sort out pickup and directions. Only your assigned driver can see this.`
                        : `Add your phone number so ${errand.helperName ?? "your helper"} can WhatsApp or call you to arrange the address and details. Only your assigned helper can see this.`}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-phone">Phone number</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder="e.g. 087 123 4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      data-testid="input-contact-phone"
                    />
                  </div>
                  <Button
                    className="w-full rounded-full"
                    onClick={handleSaveContact}
                    disabled={setErrandContact.isPending}
                    data-testid="btn-save-contact"
                  >
                    {setErrandContact.isPending ? "Sharing…" : "Share my number"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 shadow-sm bg-muted/30">
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-semibold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-primary" /> Pay first to share your number
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once you pay (just below), you'll be able to share your number so {errand.helperName ?? "your helper"} can WhatsApp or call you. Your payment is held safely and only released when you confirm the job is done.
                  </p>
                </CardContent>
              </Card>
            )
          )}

          {/* Report section — shown on accepted or completed errands */}
          {canReport && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Issue with this errand?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Report the helper if work wasn't done properly.</p>
                </div>
              </div>
              {alreadyReported ? (
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Reported
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive rounded-full"
                  onClick={() => setIsReportOpen(true)}
                  data-testid="btn-report-helper"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Helper
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
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

              {errand.status !== ErrandStatus.open && errand.requesterPhone && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <Lock className="w-3.5 h-3.5 text-primary" /> {isLift ? "Contact for directions" : "Contact the requester"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isLift
                      ? "Message or call to sort out pickup and directions."
                      : "Message or call to arrange the address and details."}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={toWhatsAppLink(errand.requesterPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white font-medium py-2.5 text-sm hover:opacity-90 transition-opacity"
                      data-testid="link-whatsapp"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${errand.requesterPhone}`}
                      className="flex items-center justify-center gap-2 rounded-full border border-border bg-background text-foreground font-medium py-2.5 text-sm hover:bg-muted transition-colors"
                      data-testid="link-call"
                    >
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{errand.requesterPhone}</p>
                </div>
              )}

              {errand.status === ErrandStatus.open && (
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border/60 p-3">
                  <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    The requester's exact address and phone number are shared privately once you accept this errand.
                  </p>
                </div>
              )}

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
                    onClick={() => {
                      if (myHelper) setSelectedHelperId(String(myHelper.id));
                      setIsAcceptOpen(true);
                    }}
                    data-testid="btn-accept-errand"
                  >
                    I can help with this
                  </Button>
                )}

                {errand.status === ErrandStatus.accepted && (
                  <>
                    {errand.budgetAmount != null && Number(errand.budgetAmount) > 0 && (
                      <>
                        {errand.paymentStatus === "paid" ? (
                          <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1" data-testid="payment-badge-paid">
                            <div className="flex items-center gap-2 text-green-700 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Paid €{errand.paidAmount?.toFixed(2) ?? errand.budgetAmount}</span>
                            </div>
                            {errand.platformFee != null && errand.paidAmount != null && (
                              <p className="text-xs text-green-700/80">
                                €{(errand.paidAmount - errand.platformFee).toFixed(2)} to helper · €{errand.platformFee.toFixed(2)} platform fee
                              </p>
                            )}
                            {errand.paidAt && (
                              <p className="text-xs text-green-700/70">
                                {format(new Date(errand.paidAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </div>
                        ) : errand.isRequester ? (
                          <>
                            <Button
                              className="w-full rounded-full" size="lg"
                              onClick={() => redirectToCheckout(errandId)}
                              disabled={isCheckoutPending}
                              data-testid="btn-pay-errand"
                            >
                              {isCheckoutPending
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting...</>
                                : <><CreditCard className="w-4 h-4 mr-2" />Pay €{errand.budgetAmount}</>}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">Pay securely by card — no account needed · 90% goes to the helper · 10% platform fee</p>
                            <p className="text-xs text-center text-muted-foreground">Your payment is held safely and only sent to the helper once you confirm the job is done.</p>
                          </>
                        ) : (
                          <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5" data-testid="text-awaiting-payment">
                            Waiting for the requester to pay. Your payment is held safely and only released once they confirm the job is done.
                          </p>
                        )}
                      </>
                    )}
                    {(() => {
                      const paymentMissing = requiresPayment && errand.paymentStatus !== "paid";
                      // Only the requester can confirm completion — this releases
                      // the held payment to the helper, so the helper must not be
                      // able to mark their own work done.
                      if (!errand.isRequester) {
                        return (
                          <div className="space-y-2">
                            <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                              Waiting for the requester to confirm the job is done.
                            </p>
                            {isAssignedHelper && (
                              <>
                                <Button
                                  className="w-full rounded-full" size="sm" variant="ghost"
                                  onClick={() => setIsAbortOpen(true)}
                                  disabled={abortErrand.isPending}
                                  data-testid="btn-abort-errand"
                                >
                                  {abortErrand.isPending ? "Backing out…" : "Back out of this job"}
                                </Button>
                                <p className="text-[11px] text-center text-muted-foreground">
                                  If you can't do it, back out so someone else can. Any payment is refunded to the requester.
                                </p>
                              </>
                            )}
                          </div>
                        );
                      }
                      return (
                        <>
                          <Button
                            className="w-full rounded-full" size="lg" variant="outline"
                            onClick={handleComplete}
                            disabled={completeErrand.isPending || paymentMissing}
                            data-testid="btn-complete-errand"
                          >
                            {completeErrand.isPending
                              ? "Confirming..."
                              : requiresPayment
                                ? "Confirm done & pay the helper"
                                : "Mark as Completed"}
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                          </Button>
                          {requiresPayment && !paymentMissing && (
                            <>
                              <p className="text-xs text-center text-muted-foreground">
                                Only confirm once the job is done — this releases the held payment to your helper.
                              </p>
                              <p className="text-[11px] text-center text-muted-foreground">
                                Your payment can't be cancelled, but if the helper backs out — or the job isn't completed within 7 working days — it's automatically refunded to you.
                              </p>
                            </>
                          )}
                          {paymentMissing && (
                            <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                              Pay first — your payment is held safely and only released to the helper when you confirm the job is done.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                {errand.status === ErrandStatus.completed && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium py-2 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" /> This errand is done!
                    </div>
                    {errand.paymentStatus === "paid" && errand.paidAmount != null && (
                      <p className="text-xs text-center text-muted-foreground">
                        Paid €{errand.paidAmount.toFixed(2)}
                        {errand.platformFee != null && ` · €${(errand.paidAmount - errand.platformFee).toFixed(2)} to helper`}
                      </p>
                    )}
                    {errand.helperId && errand.isRequester && (
                      alreadyReviewed ? (
                        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> Thanks for your review
                        </div>
                      ) : (
                        <Button
                          className="w-full rounded-full gap-2"
                          size="lg"
                          onClick={() => setIsReviewOpen(true)}
                          data-testid="btn-leave-review"
                        >
                          <Star className="w-4 h-4" /> Leave a review
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Abort / back-out dialog */}
      <Dialog open={isAbortOpen} onOpenChange={setIsAbortOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Back out of this job?</DialogTitle>
            <DialogDescription>
              This errand will reopen for someone else to pick up, and any payment the requester made is refunded in full. Only back out if you genuinely can't complete it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setIsAbortOpen(false)} disabled={abortErrand.isPending}>
              Keep the job
            </Button>
            <Button variant="destructive" className="rounded-full" onClick={handleAbort} disabled={abortErrand.isPending} data-testid="btn-confirm-abort">
              {abortErrand.isPending ? "Backing out…" : "Yes, back out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this Errand</DialogTitle>
            <DialogDescription>Select your helper profile to claim this errand.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Label htmlFor="helper-select" className="mb-2 block">Who is helping?</Label>
            <Select value={selectedHelperId} onValueChange={setSelectedHelperId}>
              <SelectTrigger id="helper-select" data-testid="select-helper-accept">
                <SelectValue placeholder="Select a helper profile" />
              </SelectTrigger>
              <SelectContent>
                {helpers?.filter(h => h.isOwner).map(h => (
                  <SelectItem key={h.id} value={h.id.toString()}>{h.name} — {h.location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!helpers?.some(h => h.isOwner) && (
              <p className="text-sm text-amber-600 mt-2">You need a helper profile to accept errands. Please register as a helper first.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptOpen(false)}>Cancel</Button>
            <Button onClick={handleAccept} disabled={acceptErrand.isPending || !selectedHelperId} data-testid="btn-confirm-accept">
              {acceptErrand.isPending ? "Accepting..." : "Confirm & Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              Report Helper
            </DialogTitle>
            <DialogDescription>
              Tell us what went wrong. Reports are reviewed by the AnyErrands team and kept confidential.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reporter-name">Your name</Label>
              <Input
                id="reporter-name"
                placeholder="e.g. Siobhán O'Brien"
                value={reporterName}
                onChange={e => setReporterName(e.target.value)}
                data-testid="input-reporter-name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-reason">What happened?</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="report-reason" data-testid="select-report-reason">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-description">Give us more detail</Label>
              <Textarea
                id="report-description"
                placeholder="Describe what happened in a few sentences…"
                rows={4}
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
                data-testid="textarea-report-description"
              />
              <p className="text-xs text-muted-foreground">{reportDescription.trim().length}/10 characters minimum</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={isReporting}
              data-testid="btn-submit-report"
            >
              {isReporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Leave a review
            </DialogTitle>
            <DialogDescription>
              {errand.helperName
                ? `How did ${errand.helperName} do? Your review helps the whole community.`
                : "How did your helper do? Your review helps the whole community."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Your rating</Label>
              <div className="flex items-center gap-1.5" data-testid="review-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    data-testid={`review-star-${n}`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        n <= (hoverRating || reviewRating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reviewer-name">Your name</Label>
              <Input
                id="reviewer-name"
                placeholder="e.g. Siobhán O'Brien"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                data-testid="input-reviewer-name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review-comment">A few words (optional)</Label>
              <Textarea
                id="review-comment"
                placeholder="What was it like working with them?"
                rows={4}
                maxLength={500}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                data-testid="textarea-review-comment"
              />
              <p className="text-xs text-muted-foreground">{reviewComment.length}/500</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
            <Button
              onClick={handleReview}
              disabled={createReview.isPending}
              data-testid="btn-submit-review"
            >
              {createReview.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
