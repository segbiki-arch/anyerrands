import { logger } from "./logger";

// Thin wrapper over the Resend HTTP API. Intentionally dependency-free (uses
// fetch) so the app never breaks when email is not configured. If no API key is
// present the call is a no-op that logs and returns — login/helper creation must
// never fail just because email delivery isn't set up yet.

function getApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "AnyErrands <onboarding@resend.dev>";
}

export function isEmailConfigured(): boolean {
  return !!getApiKey();
}

export async function sendEmail(opts: {
  to: string | null | undefined;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = getApiKey();
  const to = opts.to?.trim();

  if (!apiKey) {
    logger.info(
      { subject: opts.subject },
      "Email not sent: RESEND_API_KEY is not configured (no-op)",
    );
    return;
  }
  if (!to) {
    logger.info({ subject: opts.subject }, "Email not sent: no recipient");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error(
        { status: res.status, body: body.slice(0, 500) },
        "Resend email send failed",
      );
      return;
    }
    logger.info({ subject: opts.subject }, "Welcome email sent");
  } catch (err) {
    logger.error({ err }, "Resend email send threw");
  }
}
