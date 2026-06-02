import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetWelcomeStatus,
  useMarkCustomerWelcomeSeen,
  useMarkHelperWelcomeSeen,
  getGetWelcomeStatusQueryKey,
} from "@workspace/api-client-react";
import { WelcomeDialog, type WelcomeVariant } from "./welcome-dialog";

// Shows the one-time animated welcome popup to logged-in users. The helper
// welcome takes priority (it fires right after someone becomes a helper); the
// customer welcome shows on first login. "Seen" state is persisted server-side
// so a popup never reappears once dismissed.
export function WelcomeManager() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetWelcomeStatus({
    query: { enabled: isAuthenticated && !authLoading },
  });

  const markCustomer = useMarkCustomerWelcomeSeen();
  const markHelper = useMarkHelperWelcomeSeen();

  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<WelcomeVariant>("customer");

  useEffect(() => {
    if (isLoading || !data) return;
    if (data.showHelperWelcome) {
      setVariant("helper");
      setOpen(true);
    } else if (data.showCustomerWelcome) {
      setVariant("customer");
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [data, isLoading]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetWelcomeStatusQueryKey() });

  const markSeen = () => {
    if (variant === "helper") {
      markHelper.mutate(undefined, { onSettled: invalidate });
    } else {
      markCustomer.mutate(undefined, { onSettled: invalidate });
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    markSeen();
  };

  const handlePrimary = () => {
    setOpen(false);
    markSeen();
    setLocation(variant === "helper" ? "/profile" : "/errands/new");
  };

  if (!isAuthenticated) return null;

  return (
    <WelcomeDialog
      open={open}
      variant={variant}
      firstName={data?.firstName ?? null}
      onPrimary={handlePrimary}
      onDismiss={handleDismiss}
    />
  );
}
