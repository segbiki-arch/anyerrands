import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  FileText,
  Lock,
  Heart,
  ShieldAlert,
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

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

const TABS = [
  { id: "terms", label: "Terms of Service", icon: FileText },
  { id: "privacy", label: "Privacy Policy", icon: Lock },
  { id: "guidelines", label: "Community Guidelines", icon: Heart },
  { id: "safety", label: "Safety", icon: ShieldAlert },
] as const;

type TabId = (typeof TABS)[number]["id"];

function initialTab(): TabId {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) return hash as TabId;
  }
  return "terms";
}

export default function TermsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const EFFECTIVE_DATE = "30 May 2026";
  const CONTACT_EMAIL = "hello@anyerrands.live";
  const COMPANY = "AnyErrands";
  const LOCATION = "Nenagh, Co. Tipperary, Ireland";

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  // Keep the active tab in sync when the URL hash changes while already on this
  // page (e.g. clicking a footer "Safety"/"Community" link, or browser back).
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
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Legal, Safety &amp; Community</h1>
        </div>
        <p className="text-muted-foreground">
          These documents govern your use of {COMPANY}, a community errand and journey-sharing marketplace serving {LOCATION}.<br />
          <span className="text-xs">Last updated: {EFFECTIVE_DATE}</span>
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
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
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

      {/* ───────── TERMS OF SERVICE ───────── */}
      {activeTab === "terms" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Summary:</strong> AnyErrands connects people who need help with everyday tasks and shared journeys to local helpers in the Nenagh area. We are a technology platform only — we are not a party to the agreement between you and another user, and we do not employ helpers. By using this platform you agree to these terms. Please read them carefully.
          </div>

          <Section title="1. About AnyErrands & Our Role" defaultOpen>
            <P>{COMPANY} is a community marketplace that connects residents of Nenagh, Co. Tipperary and surrounding areas with local helpers willing to assist with everyday errands and shared journeys — including grocery shopping, dog walking, cleaning, gardening, deliveries, moving assistance, and shared transport (cost-shared journeys between neighbours, not a taxi or hire service).</P>
            <P>We act <strong>solely as a technology platform</strong> facilitating connections between errand requesters ("Clients") and errand helpers ("Helpers"). We are <strong>not a party</strong> to any agreement between Clients and Helpers, we do not supervise, direct, or control the performance of any errand, and we do not employ, engage, or act as an agent for Helpers.</P>
            <P>We do not guarantee that any errand will be accepted, that any Helper or Client will perform as agreed, or that any task will be completed to a particular standard.</P>
          </Section>

          <Section title="2. Eligibility & Accounts">
            <P>You must be at least 18 years of age to use AnyErrands. By creating an account or posting/accepting an errand, you confirm that you meet this requirement and have the legal capacity to enter into binding agreements.</P>
            <P>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately at {CONTACT_EMAIL} if you suspect any unauthorised access.</P>
            <UL items={[
              "You must provide accurate and truthful information when registering or posting errands.",
              "One person may not operate multiple accounts to circumvent platform rules.",
              "Accounts are personal and non-transferable.",
            ]} />
          </Section>

          <Section title="3. Independent Contractor Status">
            <P>Helpers are <strong>independent contractors</strong>. Nothing in these terms or in your use of the platform creates an employment, agency, partnership, joint venture, or franchise relationship between you and AnyErrands, or between any Client and Helper and AnyErrands.</P>
            <UL items={[
              "Helpers are not employees, workers, or agents of AnyErrands and are not entitled to any employment rights, benefits, holiday pay, pension, or similar from AnyErrands.",
              "Helpers decide whether, when, and how to accept and perform errands, and may work for others (including competing platforms) at any time.",
              "Helpers are solely responsible for their own taxes, PRSI, USC, VAT (where applicable), and for declaring their income to the Revenue Commissioners.",
              "Helpers are responsible for arranging their own insurance appropriate to the work they undertake (including motor and public liability insurance where relevant).",
              "Helpers must hold any licences, qualifications, vehicle documents, NCT, motor tax, and permissions required by law for the tasks they accept.",
            ]} />
            <P>AnyErrands does not withhold or pay any tax on a Helper's behalf and provides no tools, equipment, or vehicles.</P>
          </Section>

          <Section title="4. Posting & Accepting Errands">
            <P><strong>Clients</strong> may post errands with a description, location, estimated duration, and optional budget. By posting an errand, you confirm that the task is legal, safe, and does not violate these terms.</P>
            <P><strong>Helpers</strong> may browse and accept open errands. Acceptance creates a direct agreement between Client and Helper to complete the described task for the stated budget. AnyErrands is not a party to this agreement.</P>
            <UL items={[
              "Errands must be lawful and safe tasks only.",
              "Clients must provide accurate task descriptions so Helpers can make informed decisions.",
              "Helpers must only accept errands they genuinely intend, and are competent and permitted, to complete.",
              "To accept any errand, a Helper must have a helper profile with a verified Stripe payout account connected.",
              "Once an errand is accepted it is locked to that Helper and cannot be accepted by anyone else. Both parties are expected to honour the commitment.",
            ]} />
          </Section>

          <Section title="5. Payments, Stripe & Platform Fee">
            <P>AnyErrands processes payments securely through <strong>Stripe</strong>. <strong>Clients do not need a Stripe account to pay</strong> — they simply pay by card at checkout. Helpers must connect a Stripe account in order to accept errands and receive payouts.</P>
            <P>When a Client pays for an errand, the payment is held securely and only released to the Helper once the Client confirms the job is done. At that point:</P>
            <UL items={[
              "The Helper receives 90% of the errand budget to their connected account.",
              "AnyErrands retains a 10% platform fee to cover payment processing, platform maintenance, and community support.",
              "Payments are released to Helpers via Stripe Connect once the Client confirms completion.",
              "All amounts are in Euro (€).",
            ]} />
            <P>Payment processing is provided by Stripe and is subject to the <a href="https://stripe.com/ie/legal/connect-account" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">Stripe Connected Account Agreement</a> and Stripe's terms. Helpers must complete Stripe onboarding (including identity verification) before receiving payouts. AnyErrands is not responsible for delays, holds, or decisions made by Stripe during verification, nor for any payment failures caused by your bank or card provider.</P>
            <P>You must not attempt to take or move payments off-platform to avoid the fee. Volunteer errands (no budget set) are not processed through payments and carry no platform fee.</P>
          </Section>

          <Section title="6. Cancellations & Refunds">
            <P>When a Client pays for an errand, the payment is held securely and only released to the Helper once the Client confirms the job is done. A Client cannot cancel a payment on demand. Instead, the payment is automatically refunded in full to the Client's original payment method in the following situations:</P>
            <UL items={[
              "The assigned Helper backs out of the job. The errand then reopens for another Helper to pick up.",
              "The errand is not completed within 7 working days (Monday to Friday) of payment. The payment is automatically returned to the Client and the errand reopens.",
            ]} />
            <P>Automatic refunds are processed back to the original payment method and may take 5–10 business days to appear, depending on your bank or card provider.</P>
            <P>For any other dispute, cancellation, or refund request, contact us at {CONTACT_EMAIL} with the errand ID and a description of the issue. We will review the matter and, at our discretion, may facilitate a refund. AnyErrands reserves the right to decline refund requests where the errand was completed as described.</P>
          </Section>

          <Section title="7. Safety & Assumption of Risk">
            <P>AnyErrands does not vet, background-check, endorse, or supervise any Client or Helper, and does not inspect any home, vehicle, or task. <strong>You interact with other users, attend locations, give or receive shared journeys, and allow access to property entirely at your own risk.</strong></P>
            <P>You are strongly encouraged to follow our <button onClick={() => selectTab("safety")} className="text-primary underline underline-offset-2">Safety guidance</button>, including meeting in public places first, being cautious about granting access to your home, and reporting suspicious behaviour. To the fullest extent permitted by law, AnyErrands accepts no responsibility for the conduct, acts, or omissions of any user, whether online or in person.</P>
          </Section>

          <Section title="8. Helper Conduct & Reporting">
            <P>Helpers are expected to behave professionally, arrive on time, and complete errands to a reasonable standard. Clients may report a Helper where:</P>
            <UL items={[
              "The agreed work was not completed.",
              "The quality of work was significantly below a reasonable standard.",
              "The Helper failed to show up without notice.",
              "The Helper was significantly late without communication.",
            ]} />
            <P>Reports are reviewed by the AnyErrands team. Where misconduct is substantiated, we may suspend or permanently remove a user from the platform. Repeated false or malicious reports may result in account suspension.</P>
          </Section>

          <Section title="9. Prohibited Activities">
            <P>The following are strictly prohibited on AnyErrands:</P>
            <UL items={[
              "Posting or performing errands that involve illegal activities of any kind.",
              "Using the platform to harass, threaten, abuse, discriminate against, or harm other users.",
              "Scamming, defrauding, or deceiving any other user.",
              "Failing to pay for work that has been agreed and completed.",
              "Providing false information about yourself or an errand.",
              "Attempting to process or solicit payments outside the platform to avoid the fee.",
              "Creating fake reviews, reports, or accounts.",
              "Posting errands involving weapons, the purchase or handling of controlled substances, alcohol or tobacco for minors, or other age-restricted or regulated goods.",
              "Tasks involving the care of children or vulnerable adults without appropriate vetting, or any task requiring a professional licence the Helper does not hold.",
              "Scraping, reverse-engineering, hacking, or otherwise interfering with the platform or its security.",
            ]} />
            <P><strong>Zero-tolerance policy:</strong> anyone caught causing harm to another user, scamming or defrauding others, or failing to pay for completed work will be <strong>permanently banned for life</strong> from AnyErrands. Where appropriate, we will also refer the matter to An Garda Síochána or other relevant authorities.</P>
          </Section>

          <Section title="10. Dispute Resolution">
            <P>Disputes about an errand are primarily between the Client and Helper, who agree to attempt to resolve matters directly and in good faith in the first instance.</P>
            <UL items={[
              "If you cannot resolve a dispute directly, contact us at " + CONTACT_EMAIL + " with the errand ID and details. We may, at our discretion, assist by reviewing records and facilitating a refund or release of held funds — but we are not obliged to act as arbitrator and any decision we make is not a legal determination of liability.",
              "Where a payment is held and a dispute is raised before completion is confirmed, we may hold the funds until the matter is reasonably resolved or refund the Client as set out in the Cancellations & Refunds section.",
              "Card chargebacks and payment disputes are handled in line with Stripe's processes.",
            ]} />
            <P>Nothing in this section affects your statutory rights or your right to bring a claim before the Irish courts.</P>
          </Section>

          <Section title="11. Limitation of Liability">
            <P>{COMPANY} provides the platform "as is" and "as available" and makes no warranty that it will be uninterrupted, error-free, secure, or fit for any particular purpose. To the fullest extent permitted by Irish and EU law:</P>
            <UL items={[
              "AnyErrands is not liable for any loss, injury, damage, theft, or harm arising from interactions between Clients and Helpers, whether online or in person.",
              "We do not guarantee the identity, character, quality, safety, conduct, or legality of any user, errand, vehicle, or property.",
              "We are not liable for indirect, incidental, special, or consequential losses, or for loss of profit, data, or goodwill.",
              "Our total aggregate liability to you for any claim shall not exceed the total platform fees you paid to us in the 12 months preceding the claim.",
            ]} />
            <P>Nothing in these terms limits or excludes our liability for fraud, for death or personal injury caused by our negligence, or for any other liability that cannot lawfully be excluded under Irish or EU law (including any non-excludable rights you may have as a consumer).</P>
          </Section>

          <Section title="12. Indemnification">
            <P>You agree to indemnify and hold harmless AnyErrands and its operators from and against any claims, losses, liabilities, and reasonable expenses arising out of your breach of these terms, your errands or conduct, your misuse of the platform, or your violation of any law or the rights of a third party — except to the extent such claims arise from our own negligence or wilful misconduct.</P>
          </Section>

          <Section title="13. Data Protection & Privacy">
            <P>We process personal data in accordance with the EU General Data Protection Regulation (GDPR) and the Irish Data Protection Act 2018. Full details of what we collect, why, how long we keep it, and your rights are set out in our <button onClick={() => selectTab("privacy")} className="text-primary underline underline-offset-2">Privacy Policy</button>.</P>
          </Section>

          <Section title="14. Intellectual Property">
            <P>All content, branding, and software comprising the AnyErrands platform is owned by or licensed to AnyErrands. You may not reproduce, distribute, or create derivative works from our materials without written permission.</P>
            <P>By posting content on the platform (errand descriptions, photos, etc.) you grant AnyErrands a non-exclusive, royalty-free licence to display and use that content solely for operating the platform.</P>
          </Section>

          <Section title="15. Changes to These Terms">
            <P>We may update these terms from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review these terms periodically. Continued use of AnyErrands after changes constitutes your acceptance of the revised terms.</P>
          </Section>

          <Section title="16. Governing Law & Jurisdiction">
            <P>These terms are governed by the laws of Ireland. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the Irish courts. If you are a consumer, you may also benefit from any mandatory protections of the law of your country of residence.</P>
            <P>For any questions, please contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.</P>
          </Section>
        </div>
      )}

      {/* ───────── PRIVACY POLICY ───────── */}
      {activeTab === "privacy" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Your privacy matters.</strong> AnyErrands is based in Ireland and processes personal data under the EU GDPR and the Irish Data Protection Act 2018. We only collect what we need, never sell your data, and give you control over what you share.
          </div>

          <Section title="1. Who We Are (Data Controller)" defaultOpen>
            <P>{COMPANY} is the data controller for personal data collected through this platform. We are based in {LOCATION}.</P>
            <P>For privacy-related enquiries or to exercise your rights, contact us at: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a></P>
          </Section>

          <Section title="2. What Data We Collect">
            <P><strong>Data you provide directly:</strong></P>
            <UL items={[
              "Account information: your name, email address, and profile photo (provided via secure authentication).",
              "Errand details: title, description, location, duration, and budget when you post an errand or shared journey.",
              "Helper profile: name, location, bio, skills, and availability when you register as a Helper.",
              "Contact details: a phone number you choose to share with your assigned Helper or Client to coordinate a task.",
              "Report submissions: your name, the reason for the report, and your description of the issue.",
              "Payment information: handled entirely by Stripe — we never see or store your card details.",
            ]} />
            <P><strong>Data collected automatically:</strong></P>
            <UL items={[
              "Session data: cookies used to keep you logged in securely.",
              "Usage data: pages visited and features used, for platform improvement (no third-party advertising trackers).",
              "Server logs: IP addresses and request logs retained for security purposes.",
            ]} />
          </Section>

          <Section title="3. How We Use Your Data & Legal Bases">
            <P>We use your personal data only for the following purposes:</P>
            <UL items={[
              "Operating the platform — matching Clients with Helpers and facilitating errands and shared journeys (legal basis: performance of a contract).",
              "Processing payments — sharing necessary information with Stripe (legal basis: performance of a contract).",
              "Platform communications — sending notifications about errands you've posted or accepted (legal basis: performance of a contract).",
              "Safety & trust — reviewing reports, preventing fraud, and enforcing platform rules (legal basis: legitimate interests).",
              "Legal compliance — retaining records as required by Irish and EU law (legal basis: legal obligation).",
            ]} />
            <P>Where we rely on legitimate interests, we balance those interests against your rights and freedoms. Where we ever rely on consent, you may withdraw it at any time.</P>
          </Section>

          <Section title="4. Who We Share Your Data With">
            <P>We do not sell your personal data. We share data only with:</P>
            <UL items={[
              "Other users — limited information needed to complete an errand. The phone number you choose to share is shown only to the one Helper assigned to your errand (and, for paid errands, only after payment) — never to the public.",
              "Stripe — for payment processing and Helper payout account management. Stripe is a certified PCI-DSS Level 1 provider.",
              "Our hosting and infrastructure providers — to run the platform securely.",
              "Law enforcement or regulators — where required by law or to protect the rights and safety of our users.",
            ]} />
            <P>All third-party processors are bound by data processing agreements requiring them to protect your data in accordance with GDPR. Where data is transferred outside the EEA, it is protected by appropriate safeguards such as Standard Contractual Clauses.</P>
          </Section>

          <Section title="5. Cookies">
            <P>AnyErrands uses only essential cookies — specifically a session cookie to keep you logged in securely. We do not use advertising or third-party tracking cookies.</P>
            <P>You can clear cookies at any time through your browser settings. Doing so will log you out of the platform.</P>
          </Section>

          <Section title="6. Data Retention">
            <UL items={[
              "Account data: retained for as long as your account is active.",
              "Errand data: retained for 2 years after the errand is completed or closed.",
              "Payment records: retained for 7 years to comply with Irish tax and accounting regulations.",
              "Reports: retained for 3 years to support ongoing safety decisions.",
              "Server logs: retained for 90 days.",
            ]} />
            <P>On account deletion, your personal data is anonymised or deleted within 30 days, except where retention is required by law.</P>
          </Section>

          <Section title="7. Your Rights Under GDPR">
            <P>As a data subject in the EU/EEA, you have the following rights:</P>
            <UL items={[
              "Right of access — request a copy of the personal data we hold about you.",
              "Right to rectification — ask us to correct inaccurate or incomplete data.",
              "Right to erasure — request deletion of your personal data (subject to legal retention obligations).",
              "Right to restriction — ask us to limit how we process your data in certain circumstances.",
              "Right to data portability — receive your data in a structured, machine-readable format.",
              "Right to object — object to processing based on legitimate interests.",
              "Right to withdraw consent — where processing is based on consent, you may withdraw at any time.",
            ]} />
            <P>To exercise any of these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>. We will respond within 30 days. If you are unsatisfied with our response, you have the right to lodge a complaint with the <strong>Data Protection Commission (DPC)</strong> at <a href="https://www.dataprotection.ie" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">dataprotection.ie</a>.</P>
          </Section>

          <Section title="8. Data Security">
            <P>We take reasonable technical and organisational measures to protect your personal data, including:</P>
            <UL items={[
              "HTTPS encryption on all data transmitted between your browser and our servers.",
              "Session data stored securely in a PostgreSQL database with access controls.",
              "Payment data handled entirely by Stripe — we never see or store card numbers.",
              "Regular security reviews of our infrastructure.",
            ]} />
            <P>No system is completely secure. If you believe your account has been compromised, please contact us immediately at {CONTACT_EMAIL}.</P>
          </Section>

          <Section title="9. Children's Privacy">
            <P>AnyErrands is not directed at children under the age of 18. We do not knowingly collect personal data from anyone under 18. If you believe a minor has provided us with personal data, please contact us and we will delete it promptly.</P>
          </Section>

          <Section title="10. Changes to This Policy">
            <P>We may update this Privacy Policy to reflect changes in our practices or applicable law. The "Last updated" date at the top of this page will reflect any changes. We encourage you to review this policy periodically.</P>
          </Section>
        </div>
      )}

      {/* ───────── COMMUNITY GUIDELINES ───────── */}
      {activeTab === "guidelines" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            AnyErrands works because neighbours look out for one another. These guidelines are simple and separate from our Terms — they describe the spirit we expect from everyone. Four things: <strong>respect, honesty, safety, and legality</strong>.
          </div>

          <Section title="Respect" defaultOpen>
            <P>Treat every member of the community the way you'd want to be treated.</P>
            <UL items={[
              "Be polite and friendly in messages, calls, and in person.",
              "Communicate clearly and reply in good time.",
              "No harassment, abuse, discrimination, or hate of any kind.",
              "Respect people's time, homes, property, and privacy.",
            ]} />
          </Section>

          <Section title="Honesty">
            <P>Trust is everything in a small community.</P>
            <UL items={[
              "Be truthful in your profile, errand descriptions, and prices.",
              "Only accept errands you genuinely intend and are able to complete.",
              "Do what you agreed to do, and pay what you agreed to pay.",
              "No fake reviews, fake accounts, or misleading claims.",
            ]} />
          </Section>

          <Section title="Safety">
            <P>Look after yourself and others.</P>
            <UL items={[
              "Meet in public places first, especially with someone new.",
              "Be careful about giving access to your home.",
              "Report anything that feels off — you could protect a neighbour.",
              "Read our full Safety guidance before your first errand or shared journey.",
            ]} />
            <P><button onClick={() => selectTab("safety")} className="text-primary underline underline-offset-2">Read the full Safety guidance →</button></P>
          </Section>

          <Section title="Legality">
            <P>Keep everything above board.</P>
            <UL items={[
              "Only post and accept tasks that are legal and safe.",
              "Hold any licence, insurance, or document the law requires for the task.",
              "No illegal goods, controlled substances, weapons, or age-restricted items.",
              "Keep payments on the platform so everyone is protected.",
            ]} />
          </Section>

          <div className="p-4 rounded-xl bg-foreground/5 border border-border/60 text-sm text-foreground/80">
            Breaking these guidelines can lead to a warning, suspension, or a permanent ban. Serious matters may be reported to An Garda Síochána. If you see something, say something — email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.
          </div>
        </div>
      )}

      {/* ───────── SAFETY ───────── */}
      {activeTab === "safety" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 mb-6">
            <strong>Please read this before your first errand or shared journey.</strong> AnyErrands does not vet or background-check users and does not supervise tasks. Your safety is in your hands — these steps are strongly encouraged to help keep you safe.
          </div>

          <Section title="Meet in a public place first" defaultOpen>
            <P>When you're dealing with someone for the first time, arrange to meet somewhere public and busy.</P>
            <UL items={[
              "Choose a café, shop, car park, or town-centre spot for a first hand-off or pickup.",
              "Hand over keys, items, or payment-in-kind in public where possible.",
              "For shared journeys, agree a clear, public pickup and drop-off point.",
              "Build up trust over a few errands before changing these arrangements.",
            ]} />
          </Section>

          <Section title="Be cautious about home access">
            <P>Letting someone into your home is a big step — take it carefully.</P>
            <UL items={[
              "Avoid giving home access to someone you've never met until trust is established.",
              "If a task needs home access (cleaning, gardening, moving), have a friend or family member present where you can.",
              "Never share keys, alarm codes, or door codes through the platform or with strangers.",
              "Tell someone you trust who is coming, and when, and let them know once the job is done.",
              "Keep valuables, documents, and medication out of sight.",
            ]} />
          </Section>

          <Section title="Report suspicious behaviour">
            <P>If something doesn't feel right, trust your instincts and tell us.</P>
            <UL items={[
              "Use the report feature on a Helper or errand, or email " + CONTACT_EMAIL + ".",
              "Report anyone who pressures you to pay or communicate off-platform, asks for unusual personal or financial details, or behaves aggressively.",
              "Reporting helps us protect the whole community — you could be looking out for a neighbour.",
            ]} />
            <P><strong>In an emergency, or if you feel you are in danger, contact An Garda Síochána on 999 or 112 first.</strong></P>
          </Section>

          <Section title="General safety tips">
            <UL items={[
              "Keep your conversations and payments on the platform — it's there to protect you.",
              "Share only the contact details you're comfortable with, and only with your assigned Helper or Client.",
              "Agree the task, price, and timing clearly before you start.",
              "For shared journeys, check the basics (licensed driver, taxed and insured vehicle, seatbelts) and let someone know your journey.",
              "Don't carry large amounts of cash; use the platform's secure card payment instead.",
            ]} />
          </Section>

          <div className="p-4 rounded-xl bg-foreground/5 border border-border/60 text-sm text-foreground/80">
            AnyErrands provides this guidance to help, but cannot guarantee your safety and is not responsible for the conduct of other users. Always use your own judgement. See our <button onClick={() => selectTab("terms")} className="text-primary underline underline-offset-2">Terms of Service</button> for more.
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground mt-12">
        Questions? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}
