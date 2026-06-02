// Central source of truth for new-user welcome copy across channels
// (in-app notification + email). The popup copy lives in the frontend
// WelcomeDialog component. Emojis here are intentional — they are part of the
// user-facing message content, not agent output.

export type WelcomeVariant = "customer" | "helper";

function appBaseUrl(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "anyerrands.live";
  return `https://${domain}`;
}

// Short message shown in the notification bell ("push" channel).
export function welcomeNotificationMessage(variant: WelcomeVariant): string {
  if (variant === "helper") {
    return "Welcome to the AnyErrands Helper Community 🚗📦 You can now start earning by helping people nearby with everyday tasks and errands.";
  }
  return "Welcome to AnyErrands 🎉 Your local community for errands, lifts, deliveries & earning opportunities is ready.";
}

function greeting(firstName?: string | null): string {
  const name = (firstName ?? "").trim();
  return name ? `Hello ${name},` : "Hello,";
}

function emailLayout(opts: {
  heading: string;
  greeting: string;
  intro: string;
  listTitle: string;
  list: string[];
  highlights: { icon: string; text: string }[];
  closing: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const listItems = opts.list
    .map(
      (item) =>
        `<li style="margin:0 0 8px 0;color:#1a1a1a;font-size:15px;line-height:1.5;">${item}</li>`,
    )
    .join("");
  const highlightItems = opts.highlights
    .map(
      (h) =>
        `<tr><td style="padding:6px 0;font-size:15px;color:#1a1a1a;line-height:1.5;"><span style="display:inline-block;width:26px;">${h.icon}</span> ${h.text}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:#F5C400;padding:32px 32px 28px 32px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#0d0d0d;letter-spacing:-0.5px;">AnyErrands</div>
          <div style="font-size:13px;font-weight:600;color:#0d0d0d;opacity:0.7;margin-top:4px;">Nenagh, Co. Tipperary</div>
        </td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#0d0d0d;font-weight:800;">${opts.heading}</h1>
          <p style="margin:0 0 12px 0;font-size:15px;color:#1a1a1a;line-height:1.6;">${opts.greeting}</p>
          <p style="margin:0 0 20px 0;font-size:15px;color:#1a1a1a;line-height:1.6;">${opts.intro}</p>
          <p style="margin:0 0 8px 0;font-size:15px;color:#1a1a1a;font-weight:700;">${opts.listTitle}</p>
          <ul style="margin:0 0 20px 0;padding-left:20px;">${listItems}</ul>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">${highlightItems}</table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;"><tr><td style="border-radius:10px;background:#0d0d0d;">
            <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#F5C400;text-decoration:none;border-radius:10px;">${opts.ctaLabel}</a>
          </td></tr></table>
          <p style="margin:0 0 24px 0;font-size:15px;color:#1a1a1a;line-height:1.6;">${opts.closing}</p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#888;">Payments are secured & powered by Stripe Connect.</p>
          <p style="margin:0;font-size:12px;color:#aaa;">AnyErrands — local people helping local people.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildWelcomeEmail(
  variant: WelcomeVariant,
  firstName?: string | null,
): { subject: string; html: string; text: string } {
  const base = appBaseUrl();

  if (variant === "helper") {
    const list = [
      "Deliveries",
      "Shopping pickup",
      "Lifts & transport",
      "Small errands",
      "Local assistance",
    ];
    const highlights = [
      { icon: "💰", text: "Work when you want" },
      { icon: "📍", text: "Help people nearby" },
      { icon: "⭐", text: "Build your reputation through reviews" },
      { icon: "🔒", text: "Secure payments through Stripe Connect" },
    ];
    const subject = "Welcome to the AnyErrands Helper Community 🚗📦";
    const html = emailLayout({
      heading: "Welcome to the AnyErrands Helper Community 🚗📦",
      greeting: greeting(firstName),
      intro:
        "You can now start earning by helping people in your area with everyday tasks and errands.",
      listTitle: "Popular helper jobs include:",
      list,
      highlights,
      closing:
        "Thank you for helping build stronger local communities with AnyErrands.",
      ctaLabel: "Start Earning",
      ctaUrl: base,
    });
    const text = [
      "Welcome to the AnyErrands Helper Community 🚗📦",
      "",
      greeting(firstName),
      "",
      "You can now start earning by helping people in your area with everyday tasks and errands.",
      "",
      "Popular helper jobs include:",
      ...list.map((l) => `• ${l}`),
      "",
      ...highlights.map((h) => `${h.icon} ${h.text}`),
      "",
      "Thank you for helping build stronger local communities with AnyErrands.",
      "",
      `Start earning: ${base}`,
    ].join("\n");
    return { subject, html, text };
  }

  const list = [
    "Shopping pickup",
    "Deliveries",
    "Local lifts",
    "Small errands",
    "Everyday tasks",
  ];
  const highlights = [
    { icon: "⚡", text: "Fast local help" },
    { icon: "💬", text: "Easy communication" },
    { icon: "⭐", text: "Trusted community ratings" },
    { icon: "📍", text: "Support from people nearby" },
  ];
  const subject = "Welcome to AnyErrands 🎉";
  const html = emailLayout({
    heading: "Welcome to AnyErrands 👋",
    greeting: greeting(firstName),
    intro:
      "Need help with everyday errands? You're in the right place. With AnyErrands, you can quickly find local people to help with the tasks below.",
    listTitle: "Find local people to help with:",
    list,
    highlights,
    closing: "Post your first errand today and let the community help.",
    ctaLabel: "Post Your First Errand",
    ctaUrl: `${base}/errands/new`,
  });
  const text = [
    "Welcome to AnyErrands 👋",
    "",
    greeting(firstName),
    "",
    "Need help with everyday errands? You're in the right place. With AnyErrands, you can quickly find local people to help with:",
    ...list.map((l) => `• ${l}`),
    "",
    ...highlights.map((h) => `${h.icon} ${h.text}`),
    "",
    "Post your first errand today and let the community help.",
    "",
    `Post your first errand: ${base}/errands/new`,
  ].join("\n");
  return { subject, html, text };
}
