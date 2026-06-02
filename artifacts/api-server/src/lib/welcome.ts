import { db, notificationsTable } from "@workspace/db";
import { sendEmail } from "./email";
import {
  buildWelcomeEmail,
  welcomeNotificationMessage,
  type WelcomeVariant,
} from "./welcome-content";

// Sends the full welcome bundle for a new user: an in-app notification (the
// "push" channel via the bell) plus a welcome email. Failures must never block
// login or helper creation, so everything is wrapped and swallowed here.
export async function sendWelcome(
  variant: WelcomeVariant,
  recipient: { id: string; email: string | null; firstName: string | null },
  log?: { error: (obj: unknown, msg?: string) => void },
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      userId: recipient.id,
      message: welcomeNotificationMessage(variant),
    });
  } catch (err) {
    log?.error({ err, variant }, "Failed to create welcome notification");
  }

  try {
    const email = buildWelcomeEmail(variant, recipient.firstName);
    await sendEmail({
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (err) {
    log?.error({ err, variant }, "Failed to send welcome email");
  }
}
