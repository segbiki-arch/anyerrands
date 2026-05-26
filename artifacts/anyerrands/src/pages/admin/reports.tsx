import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  Flag,
  CheckCircle2,
  Clock,
  Eye,
  Link as LinkIcon,
  ArrowLeft,
  Inbox,
  Loader2,
  User,
} from "lucide-react";
import {
  useListReports,
  useUpdateReportStatus,
  getListReportsQueryKey,
  type ReportWithContext,
} from "@workspace/api-client-react";

const REASON_LABELS: Record<string, string> = {
  work_not_done: "Work not done",
  work_poor_quality: "Poor quality",
  no_show: "No-show",
  late: "Late",
  other: "Other",
};

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "bg-amber-100 text-amber-800 border-amber-200",  icon: Clock },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-800 border-blue-200",     icon: Eye },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 border-green-200",  icon: CheckCircle2 },
} as const;

type ReportStatus = "pending" | "reviewed" | "resolved";
type StatusFilter = "all" | ReportStatus;

function StatusBadge({ status }: { status: ReportStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  const label = REASON_LABELS[reason] ?? reason;
  const colorMap: Record<string, string> = {
    work_not_done: "bg-red-50 text-red-700 border-red-200",
    work_poor_quality: "bg-orange-50 text-orange-700 border-orange-200",
    no_show: "bg-purple-50 text-purple-700 border-purple-200",
    late: "bg-yellow-50 text-yellow-700 border-yellow-200",
    other: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <Badge variant="outline" className={`border font-medium text-xs ${colorMap[reason] ?? "bg-gray-50 text-gray-700"}`}>
      {label}
    </Badge>
  );
}

export default function AdminReportsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedReport, setSelectedReport] = useState<ReportWithContext | null>(null);
  const [nextStatus, setNextStatus] = useState<ReportStatus | "">("");

  const { data: reports, isLoading } = useListReports(
    statusFilter !== "all" ? { status: statusFilter } : {},
    { query: { queryKey: getListReportsQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}) } }
  );

  const updateStatus = useUpdateReportStatus();

  const handleUpdateStatus = () => {
    if (!selectedReport || !nextStatus) return;
    updateStatus.mutate(
      { id: selectedReport.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listReports"] });
          setSelectedReport(null);
          setNextStatus("");
          toast({ title: "Report updated", description: `Status changed to ${nextStatus}.` });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const counts = {
    pending:  reports?.filter(r => r.status === "pending").length  ?? 0,
    reviewed: reports?.filter(r => r.status === "reviewed").length ?? 0,
    resolved: reports?.filter(r => r.status === "resolved").length ?? 0,
  };

  const displayed = reports ?? [];

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 pb-20">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold">Reports Admin</h1>
          </div>
          <p className="text-muted-foreground ml-[52px]">Review and act on helper reports from the community.</p>
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["pending", "reviewed", "resolved"] as ReportStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-xl border p-5 text-left transition-all hover:shadow-sm ${
                statusFilter === s ? `${cfg.color} border-current/30 shadow-sm` : "bg-card border-border/60 hover:border-border"
              }`}
              data-testid={`tile-${s}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 opacity-70" />
                <span className="text-sm font-medium">{cfg.label}</span>
              </div>
              <p className="text-3xl font-bold">{isLoading ? "—" : counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Report list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-6">
                <Skeleton className="h-5 w-1/3 mb-3" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <p className="font-semibold text-lg text-foreground">No reports here</p>
            <p className="text-sm mt-1">
              {statusFilter === "all" ? "No reports have been submitted yet." : `No ${statusFilter} reports at the moment.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((report) => (
            <Card
              key={report.id}
              className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedReport(report); setNextStatus(report.status as ReportStatus); }}
              data-testid={`report-card-${report.id}`}
            >
              <CardHeader className="pb-3 flex-row items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status as ReportStatus} />
                    <ReasonBadge reason={report.reason} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), "d MMM yyyy, HH:mm")}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground truncate">
                    {report.errandTitle ?? `Errand #${report.errandId}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full shrink-0 gap-1.5 text-xs"
                  onClick={(e) => { e.stopPropagation(); setSelectedReport(report); setNextStatus(report.status as ReportStatus); }}
                >
                  Review
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Helper: <span className="font-medium text-foreground">{report.helperName ?? `#${report.helperId}`}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" />
                    Reported by: <span className="font-medium text-foreground">{report.reporterName}</span>
                  </span>
                  <a
                    href={`/errands/${report.errandId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    View errand
                  </a>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2 italic">"{report.description}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail / action dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(o) => { if (!o) { setSelectedReport(null); setNextStatus(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              Report #{selectedReport?.id}
            </DialogTitle>
            <DialogDescription>
              Review the details and update the status to track your action.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-5 py-2 text-sm">
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Errand</p>
                  <p className="font-medium">{selectedReport.errandTitle ?? `#${selectedReport.errandId}`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Helper</p>
                  <p className="font-medium">{selectedReport.helperName ?? `#${selectedReport.helperId}`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Reported by</p>
                  <p className="font-medium">{selectedReport.reporterName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Submitted</p>
                  <p className="font-medium">{format(new Date(selectedReport.createdAt), "d MMM yyyy, HH:mm")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Reason</p>
                  <ReasonBadge reason={selectedReport.reason} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Current status</p>
                  <StatusBadge status={selectedReport.status as ReportStatus} />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reporter's description</p>
                <blockquote className="pl-4 border-l-2 border-primary/30 text-foreground/80 italic leading-relaxed">
                  "{selectedReport.description}"
                </blockquote>
              </div>

              {/* Link to errand */}
              <a
                href={`/errands/${selectedReport.errandId}`}
                className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                View full errand page
              </a>

              {/* Status updater */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Update status</p>
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ReportStatus)} data-testid="select-next-status">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose new status…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending — awaiting review</SelectItem>
                    <SelectItem value="reviewed">Reviewed — under investigation</SelectItem>
                    <SelectItem value="resolved">Resolved — action taken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedReport(null); setNextStatus(""); }}>
              Close
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending || !nextStatus || nextStatus === selectedReport?.status}
              data-testid="btn-update-status"
            >
              {updateStatus.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : "Save Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
