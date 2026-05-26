import { useState } from "react";

export function useStripeCheckout() {
  const [isPending, setIsPending] = useState(false);

  async function redirectToCheckout(errandId: number) {
    setIsPending(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errandId,
          successPath: `/errands/${errandId}`,
          cancelPath: `/errands/${errandId}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Payment failed to initialise");
      }

      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } finally {
      setIsPending(false);
    }
  }

  return { redirectToCheckout, isPending };
}
