import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: notifications = [] } = useListNotifications(
    { userId: userId ?? "" },
    { query: { enabled: !!userId } },
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const invalidate = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ userId }) });
    }
  };

  const { mutate: markRead } = useMarkNotificationRead({
    mutation: { onSuccess: invalidate },
  });

  const { mutate: markAllRead } = useMarkAllNotificationsRead({
    mutation: { onSuccess: invalidate },
  });

  function handleMarkAllRead() {
    if (userId) markAllRead({ data: { userId } });
  }

  function handleMarkRead(id: number) {
    markRead({ id });
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-md"
          data-testid="notification-bell"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" data-testid="notification-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="mark-all-read"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                data-testid={`notification-item-${n.id}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  {n.read && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug text-foreground">{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
