import { useState, useEffect } from "react";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useIsAdmin(): AdminState {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ isAdmin?: boolean }>;
      })
      .then((data) => {
        if (!cancelled) {
          setIsAdmin(!!data.isAdmin);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, isLoading };
}
