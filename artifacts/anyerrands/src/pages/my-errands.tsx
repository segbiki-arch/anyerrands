import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  useListErrands,
  useDeleteErrand,
  getListErrandsQueryKey,
  getGetErrandStatsQueryKey,
  getGetRecentErrandsQueryKey,
  ErrandStatus,
  type Errand,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import { LoginRequired } from "@/components/login-required";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClipboardList, Trash2, ChevronRight, Car } from "lucide-react";
import { cn } from "@/lib/utils";

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

const CATEGORY_LABELS: Record<string, string> = {
  "Lifts & Transport": "Journey Sharing",
};

export default function MyErrandsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<Errand | null>(null);

  const { data: errands, isLoading } = useListErrands(
    { mine: true },
    { query: { enabled: isAuthenticated } },
  );
  const deleteErrand = useDeleteErrand();

  if (authLoading) return null;
  if (!isAuthenticated) {
    return (
      <LoginRequired
        title="Your errands"
        description="Log in to see the errands you've posted and manage them."
      />
    );
  }

  const sorted = errands
    ? [...errands].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const handleDelete = () => {
    if (!toDelete) return;
    const id = toDelete.id;
    deleteErrand.mutate(
      { id },
      {
        onSuccess: () => {
          setToDelete(null);
          queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey({ mine: true }) });
          queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentErrandsQueryKey() });
          toast({ title: "Errand deleted", description: "It's been removed from your history." });
        },
        onError: (e) => {
          const message = (e as { data?: { error?: string } })?.data?.error ?? "Please try again.";
          toast({ title: "Couldn't delete errand", description: message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight">Your errands</h1>
          <p className="text-muted-foreground mt-1">Everything you've posted, newest first.</p>
        </div>
        <Button asChild size="sm" className="rounded-full shrink-0 hidden sm:flex">
          <Link href="/errands/new">+ Post an Errand</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((errand) => {
            const paymentHeld = errand.paymentStatus === "paid";
            return (
              <div
                key={errand.id}
                className="group flex items-stretch gap-3 bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors"
                data-testid={`my-errand-${errand.id}`}
              >
                <Link
                  href={`/errands/${errand.id}`}
                  className="flex-1 min-w-0 p-5 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", STATUS_STYLES[errand.status])}>
                        {STATUS_LABELS[errand.status] ?? errand.status}
                      </span>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        {errand.category === "Lifts & Transport" && <Car className="w-3 h-3" />}
                        {CATEGORY_LABELS[errand.category] ?? errand.category}
                      </span>
                    </div>
                    <h3 className="font-bold leading-snug truncate text-foreground group-hover:text-primary transition-colors">
                      {errand.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Posted {formatDistanceToNow(new Date(errand.createdAt), { addSuffix: true })}
                      {errand.helperName && errand.status !== ErrandStatus.open && (
                        <> · {errand.status === ErrandStatus.completed ? "done by" : "accepted by"} {errand.helperName}</>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
                </Link>
                <button
                  onClick={() => setToDelete(errand)}
                  disabled={paymentHeld}
                  title={paymentHeld ? "Resolve the held payment before deleting" : "Delete errand"}
                  className="px-4 flex items-center justify-center border-l border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  data-testid={`btn-delete-errand-${errand.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-lg font-bold">You haven't posted any errands yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Need a hand with something? Post an errand and a neighbour will pick it up.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/errands/new">Post an Errand</Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this errand?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `"${toDelete.title}" will be permanently removed from your history. This can't be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete">Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteErrand.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-delete"
            >
              {deleteErrand.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
