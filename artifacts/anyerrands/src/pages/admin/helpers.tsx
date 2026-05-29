import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  ArrowLeft,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Inbox,
  Banknote,
} from "lucide-react";

type AdminHelper = {
  id: number;
  name: string;
  location: string;
  errandsCompleted: number;
  errandCount: number;
  stripeConnected: boolean;
  ownerEmail: string | null;
  claimed: boolean;
  createdAt: string;
};

export default function AdminHelpersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [helpers, setHelpers] = useState<AdminHelper[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AdminHelper | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/helpers", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      setHelpers(await res.json());
    } catch {
      toast({ title: "Couldn't load helpers", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/helpers/${target.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error(String(res.status));
      toast({ title: "Helper profile deleted", description: `${target.name} (#${target.id}) was removed.` });
      setTarget(null);
      await load();
    } catch {
      toast({ title: "Couldn't delete", description: "Please try again.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 pb-20">
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="-ml-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 w-4 h-4" /> Back home
      </Button>

      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Helper Profiles</h1>
        {helpers && (
          <Badge variant="secondary" className="ml-2 rounded-full">{helpers.length} total</Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground -mt-4">
        Review every helper profile and remove duplicates. Deleting a profile detaches it from any
        errands first, so no errand is lost.
      </p>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : helpers && helpers.length > 0 ? (
        <div className="space-y-4">
          {helpers.map((h) => (
            <Card key={h.id} className="border-border/60 shadow-sm">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{h.name}</span>
                    <Badge variant="outline" className="text-xs font-normal">#{h.id}</Badge>
                    {h.claimed ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Claimed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal text-xs gap-1">
                        <XCircle className="w-3 h-3" /> Unclaimed
                      </Badge>
                    )}
                    {h.stripeConnected && (
                      <Badge variant="outline" className="font-normal text-xs gap-1 border-primary/40 text-primary">
                        <Banknote className="w-3 h-3" /> Stripe
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span>{h.location}</span>
                    <span>{h.errandCount} errand{h.errandCount === 1 ? "" : "s"}</span>
                    <span>{h.errandsCompleted} completed</span>
                    {h.ownerEmail && <span>{h.ownerEmail}</span>}
                    <span>Joined {format(new Date(h.createdAt), "d MMM yyyy")}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTarget(h)}
                  className="shrink-0 gap-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  data-testid={`btn-delete-helper-${h.id}`}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-2xl text-center gap-3">
          <Inbox className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-lg font-medium text-foreground">No helper profiles</p>
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete helper profile?</DialogTitle>
            <DialogDescription>
              {target && (
                <>
                  This permanently removes <span className="font-semibold">{target.name}</span> (#{target.id}).
                  {target.errandCount > 0
                    ? ` Its ${target.errandCount} linked errand${target.errandCount === 1 ? "" : "s"} will be detached, not deleted.`
                    : " It has no linked errands."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : <><Trash2 className="w-4 h-4" /> Delete profile</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
