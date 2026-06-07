import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type WelcomeVariant = "customer" | "helper";

type VariantContent = {
  badge: string;
  title: string;
  subtitle: string;
  tagsLabel: string;
  tags: string[];
  highlights: { icon: string; text: string }[];
  ctaLabel: string;
};

function getContent(variant: WelcomeVariant, firstName?: string | null): VariantContent {
  const name = (firstName ?? "").trim();
  if (variant === "helper") {
    return {
      badge: "🚗📦",
      title: name ? `Welcome, ${name}!` : "Welcome to the Helper Community",
      subtitle:
        "You can now start earning by helping people in your area with everyday tasks and errands.",
      tagsLabel: "Popular helper jobs",
      tags: ["Deliveries", "Shopping pickup", "Journey sharing", "Small errands", "Local assistance"],
      highlights: [
        { icon: "💰", text: "Work when you want" },
        { icon: "📍", text: "Help people nearby" },
        { icon: "⭐", text: "Build your reputation through reviews" },
        { icon: "🔒", text: "Secure payments through Stripe Connect" },
      ],
      ctaLabel: "Start Earning",
    };
  }
  return {
    badge: "👋",
    title: name ? `Welcome, ${name}!` : "Welcome to AnyErrands",
    subtitle:
      "Need help with everyday errands? You're in the right place. Find local people to help, fast.",
    tagsLabel: "Get help with",
    tags: ["Shopping pickup", "Deliveries", "Shared journeys", "Small errands", "Everyday tasks"],
    highlights: [
      { icon: "⚡", text: "Fast local help" },
      { icon: "💬", text: "Easy communication" },
      { icon: "⭐", text: "Trusted community ratings" },
      { icon: "📍", text: "Support from people nearby" },
    ],
    ctaLabel: "Post Your First Errand",
  };
}

export function WelcomeDialog({
  open,
  variant,
  firstName,
  onPrimary,
  onDismiss,
}: {
  open: boolean;
  variant: WelcomeVariant;
  firstName?: string | null;
  onPrimary: () => void;
  onDismiss: () => void;
}) {
  const c = getContent(variant, firstName);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-background shadow-2xl"
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
              >
                {/* Header band */}
                <div className="relative bg-primary px-6 pb-7 pt-8 text-center">
                  <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(120px_120px_at_20%_0%,#fff,transparent),radial-gradient(160px_160px_at_90%_120%,#fff,transparent)]" />
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.12 }}
                    className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-3xl shadow-lg"
                  >
                    <span aria-hidden>{c.badge}</span>
                  </motion.div>
                  <DialogPrimitive.Title className="text-2xl font-extrabold leading-tight tracking-tight text-primary-foreground">
                    {c.title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mx-auto mt-2 max-w-xs text-sm font-medium leading-relaxed text-primary-foreground/80">
                    {c.subtitle}
                  </DialogPrimitive.Description>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 pt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {c.tagsLabel}
                  </p>
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {c.tags.map((t, i) => (
                      <motion.span
                        key={t}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.04 }}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {t}
                      </motion.span>
                    ))}
                  </div>

                  <ul className="mb-6 space-y-2.5">
                    {c.highlights.map((h, i) => (
                      <motion.li
                        key={h.text}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.07 }}
                        className="flex items-center gap-3 text-sm font-medium text-foreground"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base">
                          <span aria-hidden>{h.icon}</span>
                        </span>
                        {h.text}
                      </motion.li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      className="h-12 w-full rounded-xl text-base font-bold"
                      onClick={onPrimary}
                      data-testid="button-welcome-primary"
                    >
                      {c.ctaLabel}
                    </Button>
                    <button
                      onClick={onDismiss}
                      className="mx-auto py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      data-testid="button-welcome-dismiss"
                    >
                      Maybe later
                    </button>
                  </div>

                  <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    Secure payments with Stripe Connect
                  </p>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
