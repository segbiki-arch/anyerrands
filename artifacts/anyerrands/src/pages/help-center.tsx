import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  LifeBuoy,
  Sparkles,
  CreditCard,
  RefreshCw,
  ShieldAlert,
  Heart,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-foreground">{title}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-1 space-y-3 text-sm text-foreground/80 leading-relaxed border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal pl-5 space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
  );
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

const TABS = [
  { id: "works", label: "How it works", icon: Sparkles },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "refunds", label: "Refunds & disputes", icon: RefreshCw },
  { id: "safety", label: "Safety", icon: ShieldAlert },
  { id: "rules", label: "Community rules", icon: Heart },
  { id: "contact", label: "Contact support", icon: Mail },
] as const;

type TabId = (typeof TABS)[number]["id"];

function initialTab(): TabId {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) return hash as TabId;
  }
  return "works";
}

const CONTACT_EMAIL = "hello@anyerrands.live";

export default function HelpCenterPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  // Keep the active tab in sync when the URL hash changes while already on this
  // page (e.g. clicking a footer "Help"/"Payments" link, or browser back).
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.id === hash)) setActiveTab(hash as TabId);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 pb-24">
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Help Centre</h1>
        </div>
        <p className="text-muted-foreground">
          Everything you need to know about using AnyErrands — how it works, how payments and refunds are handled, staying safe, and how to reach us if you need a hand.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-xl mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => selectTab(id)}
            data-testid={`tab-${id}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ───────── HOW IT WORKS ───────── */}
      {activeTab === "works" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>The short version:</strong> someone posts an errand or a shared journey, a local neighbour accepts it, the job gets done, and payment is released. No app store needed — it runs straight from your phone or computer.
          </div>

          <Section title="What is AnyErrands?" defaultOpen>
            <P>AnyErrands is a community marketplace for Nenagh, Co. Tipperary and the surrounding area. It connects people who need a hand with everyday tasks — the shopping, dog walking, cleaning, gardening, deliveries, small jobs, or a shared journey into town — with local people happy to help and earn.</P>
          </Section>

          <Section title="If you need a hand (posting an errand or journey)">
            <OL items={[
              "Log in, then choose “Post an Errand” or “Journey Sharing”.",
              "Describe what you need, where, roughly how long it'll take, and set a budget if there is one.",
              "A local Helper accepts your errand. You'll be notified when they do.",
              "Pay securely by card. Your money is held safely — it is not released yet.",
              "Once the job is done, confirm it. The payment is then released to your Helper.",
            ]} />
            <P>You can keep track of everything you've posted under <button onClick={() => setLocation("/my-errands")} className="text-primary underline underline-offset-2">Your Errands</button>.</P>
          </Section>

          <Section title="If you want to earn (becoming a Helper)">
            <OL items={[
              "Go to “Become a Helper” and set up your helper profile.",
              "Connect a Stripe payout account so you can get paid (this is a quick, secure once-off setup).",
              "Browse open errands and shared journeys, and accept the ones that suit you.",
              "Do the job, coordinate any details with the requester by phone or WhatsApp.",
              "When the requester confirms it's done, your payment is released to your bank.",
            ]} />
            <P>You keep the large majority of every job — see the <button onClick={() => selectTab("payments")} className="text-primary underline underline-offset-2">Payments</button> section for the exact split.</P>
          </Section>

          <Section title="What's “Journey Sharing”?">
            <P>Journey Sharing connects people travelling the same way so they can share the drive and split the travel costs. You post the journey you need — to an appointment, the shops, the airport, or anywhere locally — and a neighbour already heading in that direction can take you along. You simply contribute towards fuel and travel costs; it's cost-sharing between neighbours, not a taxi or hire service. The contribution is held safely and released to the driver once you confirm the journey is done.</P>
          </Section>

          <Section title="Do I need to install an app?">
            <P>No. AnyErrands runs in your web browser. You can also add it to your home screen for quick access — on most phones, open <strong>anyerrands.live</strong>, tap your browser's menu, and choose “Add to Home Screen”.</P>
          </Section>
        </div>
      )}

      {/* ───────── PAYMENTS ───────── */}
      {activeTab === "payments" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Your money is protected.</strong> When you pay for an errand, the money is held securely and only released to your Helper once you confirm the job is done.
          </div>

          <Section title="How do I pay?" defaultOpen>
            <P>You pay by card at checkout — there's nothing to install and you don't need a Stripe account to pay. Payments are processed securely by Stripe; AnyErrands never sees or stores your card details.</P>
          </Section>

          <Section title="When is my Helper actually paid?">
            <P>Your payment is held safely as soon as you pay. It is only released to the Helper after <strong>you confirm the errand is done</strong>. This protects both sides — you don't pay out for work that hasn't happened, and your Helper knows the funds are there waiting.</P>
          </Section>

          <Section title="What does it cost? (the fee)">
            <P>When a job is completed and you release the payment:</P>
            <UL items={[
              "Your Helper receives 90% of the errand budget.",
              "AnyErrands keeps a 10% fee, which covers secure payment processing, running the platform, and community support.",
              "All amounts are in Euro (€).",
            ]} />
            <P>Errands posted with no budget (volunteer favours) don't go through payments and have no fee.</P>
          </Section>

          <Section title="How do Helpers get paid out?">
            <P>Helpers connect a Stripe payout account once, during sign-up. After a job is confirmed, the money lands in that account and is paid out to their bank by Stripe. Helpers must complete Stripe's quick identity check before they can receive payouts.</P>
          </Section>

          <Section title="Is it safe to pay through AnyErrands?">
            <P>Yes. Payments are handled by Stripe, a certified PCI-DSS Level 1 provider trusted by millions of businesses. Please always pay and get paid through AnyErrands — never move payments off-platform, as that removes the protection of held funds and the ability to help if something goes wrong.</P>
          </Section>
        </div>
      )}

      {/* ───────── REFUNDS & DISPUTES ───────── */}
      {activeTab === "refunds" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>If a job doesn't happen, you get your money back.</strong> Held payments are automatically refunded when an errand falls through.
          </div>

          <Section title="When am I automatically refunded?" defaultOpen>
            <P>Because your payment is held until the job is confirmed done, you're protected automatically in these cases:</P>
            <UL items={[
              "Your assigned Helper backs out — the errand reopens for someone else, and your payment is refunded.",
              "The errand isn't completed within 7 working days (Mon–Fri) of payment — your payment is automatically returned and the errand reopens.",
            ]} />
            <P>Refunds go back to your original card and can take 5–10 business days to appear, depending on your bank.</P>
          </Section>

          <Section title="The job wasn't done properly — what can I do?">
            <P>Don't confirm completion if the work wasn't done. First, try to sort it out directly with your Helper — most issues are simple misunderstandings. If you can't reach a resolution, contact us (see below) with the errand details and we'll review it.</P>
          </Section>

          <Section title="How do I raise a dispute?">
            <OL items={[
              <>Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.</>,
              "Include the errand title (or ID) and a short description of what went wrong.",
              "We'll look into it, and where a payment is being held we may hold it until things are resolved, or refund you.",
            ]} />
            <P>We aim to be fair to both sides. We may decline a refund where an errand was genuinely completed as described. This doesn't affect your statutory consumer rights.</P>
          </Section>

          <Section title="Where are the full terms?">
            <P>This is a plain-language summary. The formal cancellation, refund and dispute terms are in our <button onClick={() => setLocation("/terms")} className="text-primary underline underline-offset-2">Terms of Service</button>.</P>
          </Section>
        </div>
      )}

      {/* ───────── SAFETY ───────── */}
      {activeTab === "safety" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Your safety comes first.</strong> AnyErrands is built on neighbourly trust, but please take the same sensible precautions you would with anyone you don't yet know.
          </div>

          <Section title="Meeting and handovers" defaultOpen>
            <UL items={[
              "Where you can, meet in a public place first, especially the first time.",
              "Keep arrangements and messages on record (a quick text or WhatsApp) so there's a clear trail.",
              "Tell a friend or family member where you're going if you're meeting someone new.",
            ]} />
          </Section>

          <Section title="Letting someone into your home">
            <UL items={[
              "Be cautious about giving access to your home. Only do so when you're comfortable, and consider having someone with you.",
              "Don't share keys, codes, or alarm details unless absolutely necessary for the task.",
              "Put away valuables and sensitive documents before a Helper visits.",
            ]} />
          </Section>

          <Section title="Journey sharing">
            <UL items={[
              "Share your trip details with someone you trust before setting off.",
              "Check the basics — that the driver and car match what was agreed.",
              "You're never obliged to continue a journey you're not comfortable with.",
            ]} />
          </Section>

          <Section title="Reporting a problem">
            <P>If someone behaves suspiciously, makes you uncomfortable, or breaks the rules, please report it — you can report a Helper from their profile, or email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>. In an emergency, always contact An Garda Síochána on <strong>112</strong> or <strong>999</strong> first.</P>
            <P>AnyErrands is a technology platform and does not vet or supervise users, so you interact with others at your own risk. The full detail is in our <button onClick={() => setLocation("/terms")} className="text-primary underline underline-offset-2">Safety guidance and Terms</button>.</P>
          </Section>
        </div>
      )}

      {/* ───────── COMMUNITY RULES ───────── */}
      {activeTab === "rules" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Be a good neighbour.</strong> AnyErrands works because people treat each other with respect, honesty, and care. A few simple rules keep it that way.
          </div>

          <Section title="Respect" defaultOpen>
            <UL items={[
              "Treat everyone with courtesy — no harassment, threats, abuse, or discrimination of any kind.",
              "Communicate clearly and politely, and be on time for what you've agreed.",
            ]} />
          </Section>

          <Section title="Honesty">
            <UL items={[
              "Describe errands and helper profiles truthfully and accurately.",
              "Only accept errands you genuinely intend, and are able, to complete.",
              "No fake accounts, fake reviews, or false reports.",
            ]} />
          </Section>

          <Section title="Fair dealing">
            <UL items={[
              "Always pay for work that's been agreed and completed.",
              "Keep payments on the platform — don't take them off-app to avoid the fee.",
              "Honour your commitments; if plans change, let the other person know as early as you can.",
            ]} />
          </Section>

          <Section title="Keep it legal and safe">
            <UL items={[
              "Only post lawful, safe tasks.",
              "No weapons, controlled substances, age-restricted goods for minors, or anything requiring a licence the Helper doesn't hold.",
              "No tasks involving the care of children or vulnerable adults without proper vetting.",
            ]} />
          </Section>

          <Section title="What happens if rules are broken?">
            <P><strong>Zero tolerance:</strong> anyone who scams or defrauds others, causes harm, or refuses to pay for completed work will be permanently banned, and serious matters may be referred to the Gardaí. You can read the full list in our <button onClick={() => setLocation("/terms")} className="text-primary underline underline-offset-2">Community Guidelines and Terms</button>.</P>
          </Section>
        </div>
      )}

      {/* ───────── CONTACT SUPPORT ───────── */}
      {activeTab === "contact" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>We're here to help.</strong> If something isn't working or you're not sure what to do, get in touch — a real person in Nenagh will read it.
          </div>

          <Section title="Email us" defaultOpen>
            <P>The best way to reach us is by email:</P>
            <P>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2 font-semibold">{CONTACT_EMAIL}</a>
            </P>
            <P>To help us sort things out quickly, please include the errand title (or ID) and a short description of what's happening. If it's about a payment or refund, let us know the date you paid.</P>
            <div className="pt-2">
              <Button asChild className="rounded-full">
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <Mail className="w-4 h-4 mr-2" /> Email support
                </a>
              </Button>
            </div>
          </Section>

          <Section title="Common questions">
            <UL items={[
              <>How AnyErrands works — see the <button onClick={() => selectTab("works")} className="text-primary underline underline-offset-2">How it works</button> tab.</>,
              <>Questions about paying or getting paid — see <button onClick={() => selectTab("payments")} className="text-primary underline underline-offset-2">Payments</button>.</>,
              <>Refunds or a job that went wrong — see <button onClick={() => selectTab("refunds")} className="text-primary underline underline-offset-2">Refunds &amp; disputes</button>.</>,
              <>Staying safe — see <button onClick={() => selectTab("safety")} className="text-primary underline underline-offset-2">Safety</button>.</>,
            ]} />
          </Section>

          <Section title="Reporting someone">
            <P>If a Helper didn't show, didn't complete the work, or behaved inappropriately, you can report them directly from their profile, or email us with the details. In an emergency, always call An Garda Síochána on <strong>112</strong> or <strong>999</strong> first.</P>
          </Section>

          <Section title="Legal & privacy">
            <P>For our full Terms of Service, Privacy Policy, Community Guidelines and Safety guidance, visit the <button onClick={() => setLocation("/terms")} className="text-primary underline underline-offset-2">Legal, Safety &amp; Community</button> page.</P>
          </Section>
        </div>
      )}
    </div>
  );
}
