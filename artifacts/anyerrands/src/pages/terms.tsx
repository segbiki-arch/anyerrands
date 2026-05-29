import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, FileText, ChevronDown, ChevronUp } from "lucide-react";
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

function UL({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default function TermsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  const EFFECTIVE_DATE = "26 May 2026";
  const CONTACT_EMAIL = "hello@anyerrands.live";
  const COMPANY = "AnyErrands";
  const LOCATION = "Nenagh, Co. Tipperary, Ireland";

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
          <h1 className="text-3xl font-serif font-bold">Legal & Privacy</h1>
        </div>
        <p className="text-muted-foreground">
          These documents govern your use of {COMPANY}, a community errand marketplace serving {LOCATION}.<br />
          <span className="text-xs">Last updated: {EFFECTIVE_DATE}</span>
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit">
        {(["terms", "privacy"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4" />
            {tab === "terms" ? "Terms of Service" : "Privacy Policy"}
          </button>
        ))}
      </div>

      {/* ───────── TERMS OF SERVICE ───────── */}
      {activeTab === "terms" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Summary:</strong> AnyErrands connects people who need help with everyday tasks to local helpers in the Nenagh area. By using this platform you agree to these terms. Please read them carefully.
          </div>

          <Section title="1. About AnyErrands" defaultOpen>
            <P>{COMPANY} is a community marketplace that connects residents of Nenagh, Co. Tipperary and surrounding areas with local helpers willing to assist with everyday errands — including grocery shopping, dog walking, cleaning, gardening, car washing, dish washing, delivery, and moving assistance.</P>
            <P>We act solely as a technology platform facilitating connections between errand requesters ("Clients") and errand helpers ("Helpers"). We are not a party to any agreement between Clients and Helpers, and we do not employ Helpers.</P>
          </Section>

          <Section title="2. Eligibility & Accounts">
            <P>You must be at least 18 years of age to use AnyErrands. By creating an account or posting/accepting an errand, you confirm that you meet this requirement.</P>
            <P>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately at {CONTACT_EMAIL} if you suspect any unauthorised access.</P>
            <UL items={[
              "You must provide accurate and truthful information when registering or posting errands.",
              "One person may not operate multiple accounts to circumvent platform rules.",
              "Accounts are non-transferable.",
            ]} />
          </Section>

          <Section title="3. Posting & Accepting Errands">
            <P><strong>Clients</strong> may post errands with a description, location, estimated duration, and optional budget. By posting an errand, you confirm that the task is legal and does not violate these terms.</P>
            <P><strong>Helpers</strong> may browse and accept open errands. Acceptance creates a direct agreement between Client and Helper to complete the described task for the stated budget. AnyErrands is not a party to this agreement.</P>
            <UL items={[
              "Errands must be lawful and safe tasks.",
              "Clients must provide accurate task descriptions so Helpers can make informed decisions.",
              "Helpers must only accept errands they genuinely intend to complete.",
              "Once an errand is accepted, both parties are expected to honour the commitment.",
            ]} />
          </Section>

          <Section title="4. Payments & Platform Fee">
            <P>AnyErrands processes payments securely through <strong>Stripe</strong>. <strong>Clients do not need a Stripe account to pay</strong> — they simply pay by card at checkout. Only Helpers need a Stripe account, and only so they can receive their payouts.</P>
            <P>When a Client pays for an errand, the payment is held securely by AnyErrands and only released to the Helper once the Client confirms the job is done. At that point:</P>
            <UL items={[
              "The Helper receives 90% of the errand budget directly to their connected bank account.",
              "AnyErrands retains a 10% platform fee to cover payment processing, platform maintenance, and community support.",
              "Payments are released to Helpers via Stripe Connect once the Client confirms completion.",
              "All amounts are in Euro (€).",
            ]} />
            <P>Helpers must complete Stripe Express onboarding (including identity verification) before receiving payouts. AnyErrands is not responsible for delays caused by Stripe's verification process.</P>
            <P>Volunteer errands (no budget set) are not processed through payments and carry no platform fee.</P>
          </Section>

          <Section title="5. Cancellations & Refunds">
            <P>Cancellation and refund requests should be raised directly between Clients and Helpers in the first instance. Where agreement cannot be reached:</P>
            <UL items={[
              "Contact us at " + CONTACT_EMAIL + " with the errand ID and a description of the issue.",
              "We will review the matter and, at our discretion, may facilitate a refund.",
              "Refunds are processed back to the original payment method and may take 5–10 business days.",
              "AnyErrands reserves the right to decline refund requests where the errand was completed as described.",
            ]} />
          </Section>

          <Section title="6. Helper Conduct & Reporting">
            <P>Helpers are expected to behave professionally, arrive on time, and complete errands to a reasonable standard. Clients may report a Helper where:</P>
            <UL items={[
              "The agreed work was not completed.",
              "The quality of work was significantly below a reasonable standard.",
              "The Helper failed to show up without notice.",
              "The Helper was significantly late without communication.",
            ]} />
            <P>Reports are reviewed by the AnyErrands team. Where misconduct is substantiated, we may suspend or permanently remove a Helper from the platform. Repeated false or malicious reports by Clients may result in account suspension.</P>
          </Section>

          <Section title="7. Prohibited Activities">
            <P>The following are strictly prohibited on AnyErrands:</P>
            <UL items={[
              "Posting errands that involve illegal activities of any kind.",
              "Using the platform to harass, threaten, or harm other users.",
              "Scamming, defrauding, or deceiving any other user.",
              "Failing to pay for work that has been agreed and completed.",
              "Providing false information about yourself or an errand.",
              "Attempting to process payments outside the platform to avoid the fee.",
              "Creating fake reviews, reports, or accounts.",
              "Scraping, reverse-engineering, or attempting to interfere with the platform.",
              "Posting errands involving the purchase or handling of controlled substances.",
            ]} />
            <P><strong>Zero-tolerance policy:</strong> anyone caught causing harm to another user, scamming or defrauding others, or failing to pay for completed work will be <strong>permanently banned for life</strong> from AnyErrands. Where appropriate, we will also refer the matter to An Garda Síochána or other relevant authorities.</P>
          </Section>

          <Section title="8. Limitation of Liability">
            <P>{COMPANY} provides the platform "as is" and makes no warranty that it will be uninterrupted, error-free, or meet your specific requirements. To the fullest extent permitted by Irish law:</P>
            <UL items={[
              "AnyErrands is not liable for any loss or damage arising from interactions between Clients and Helpers.",
              "We do not guarantee the quality, safety, or legality of any errand or Helper.",
              "Our total aggregate liability to you shall not exceed the total platform fees paid by you in the 12 months preceding the claim.",
            ]} />
            <P>Nothing in these terms limits our liability for fraud, death, or personal injury caused by our negligence, or any other liability that cannot be excluded under Irish or EU law.</P>
          </Section>

          <Section title="9. Intellectual Property">
            <P>All content, branding, and software comprising the AnyErrands platform is owned by or licensed to AnyErrands. You may not reproduce, distribute, or create derivative works from our materials without written permission.</P>
            <P>By posting content on the platform (errand descriptions, photos, etc.) you grant AnyErrands a non-exclusive, royalty-free licence to display and use that content solely for operating the platform.</P>
          </Section>

          <Section title="10. Changes to These Terms">
            <P>We may update these terms from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review these terms periodically. Continued use of AnyErrands after changes constitutes your acceptance of the revised terms.</P>
          </Section>

          <Section title="11. Governing Law">
            <P>These terms are governed by the laws of Ireland. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the Irish courts.</P>
            <P>For any questions, please contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.</P>
          </Section>
        </div>
      )}

      {/* ───────── PRIVACY POLICY ───────── */}
      {activeTab === "privacy" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80 mb-6">
            <strong>Your privacy matters.</strong> AnyErrands is based in Ireland and subject to GDPR. We only collect what we need, never sell your data, and give you control over what you share.
          </div>

          <Section title="1. Who We Are (Data Controller)" defaultOpen>
            <P>{COMPANY} is the data controller for personal data collected through this platform. We are based in {LOCATION}, Ireland.</P>
            <P>For privacy-related enquiries or to exercise your rights, contact our data controller at: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a></P>
          </Section>

          <Section title="2. What Data We Collect">
            <P><strong>Data you provide directly:</strong></P>
            <UL items={[
              "Account information: your name, email address, and profile photo (provided via Replit authentication).",
              "Errand details: title, description, location, duration, and budget when you post an errand.",
              "Helper profile: name, location, bio, skills, and availability when you register as a Helper.",
              "Report submissions: your name, the reason for the report, and your description of the issue.",
              "Payment information: handled entirely by Stripe — we never store your card details.",
            ]} />
            <P><strong>Data collected automatically:</strong></P>
            <UL items={[
              "Session data: cookies used to keep you logged in securely.",
              "Usage data: pages visited and features used, for platform improvement (no third-party analytics trackers).",
              "Server logs: IP addresses and request logs retained for security purposes.",
            ]} />
          </Section>

          <Section title="3. How We Use Your Data">
            <P>We use your personal data only for the following purposes:</P>
            <UL items={[
              "Operating the platform — matching Clients with Helpers and facilitating errands.",
              "Processing payments — sharing necessary information with Stripe to process transactions.",
              "Platform communications — sending notifications about errands you've posted or accepted.",
              "Safety & trust — reviewing reports and taking action where platform rules are violated.",
              "Legal compliance — retaining records as required by Irish and EU law.",
            ]} />
            <P>We rely on the following legal bases under GDPR: <strong>contract performance</strong> (to provide the service you've signed up for), <strong>legitimate interests</strong> (platform security and fraud prevention), and <strong>legal obligation</strong> (regulatory compliance).</P>
          </Section>

          <Section title="4. Who We Share Your Data With">
            <P>We do not sell your personal data. We share data only with:</P>
            <UL items={[
              "Stripe — for payment processing and Helper payout account management. Stripe is a certified PCI-DSS Level 1 provider.",
              "Replit — our hosting and authentication infrastructure provider.",
              "Law enforcement or regulators — where required by law or to protect the rights and safety of our users.",
            ]} />
            <P>All third-party processors are bound by data processing agreements that require them to protect your data in accordance with GDPR.</P>
          </Section>

          <Section title="5. Cookies">
            <P>AnyErrands uses only essential cookies — specifically a session cookie to keep you logged in securely. We do not use advertising, tracking, or analytics cookies from third parties.</P>
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

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground mt-12">
        Questions? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}
