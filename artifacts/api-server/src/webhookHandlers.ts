import Stripe from 'stripe';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db, errandsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { logger } from './lib/logger';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // Verify signature ourselves so app-level handling does not depend on the
    // stripe-replit-sync layer (which can be broken/uninitialized).
    const stripe = await getUncachableStripeClient();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);

    // 1. App-level handling — the critical path for our errand state.
    try {
      await WebhookHandlers.handleAppEvent(event);
    } catch (err) {
      logger.error({ err, eventType: event.type, eventId: event.id }, 'App-level Stripe handler failed');
      throw err; // re-raise so Stripe retries
    }

    // 2. Best-effort: mirror state into stripe-replit-sync's tables. If this
    // layer is misconfigured we still acknowledge the webhook.
    try {
      const sync = await getStripeSync();
      await sync.processEvent(event);
    } catch (err) {
      logger.warn({ err, eventType: event.type }, 'stripe-replit-sync mirror failed (non-fatal)');
    }
  }

  private static async handleAppEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await WebhookHandlers.markErrandPaidFromSession(session);
        return;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent && typeof charge.payment_intent === 'string') {
          await db
            .update(errandsTable)
            .set({ paymentStatus: 'refunded', updatedAt: new Date() })
            .where(eq(errandsTable.paymentIntentId, charge.payment_intent));
        }
        return;
      }
      default:
        return;
    }
  }

  private static async markErrandPaidFromSession(session: Stripe.Checkout.Session): Promise<void> {
    if (session.payment_status !== 'paid') return;

    const errandIdRaw = session.metadata?.errandId;
    if (!errandIdRaw) {
      logger.warn({ sessionId: session.id }, 'Checkout session has no errandId metadata; skipping');
      return;
    }
    const errandId = parseInt(errandIdRaw, 10);
    if (isNaN(errandId)) return;

    const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, errandId));
    if (!errand) {
      logger.warn({ errandId, sessionId: session.id }, 'Errand for paid checkout session not found');
      return;
    }
    if (errand.paymentStatus === 'paid') return; // idempotent

    const stripe = await getUncachableStripeClient();
    let amountCents = session.amount_total ?? 0;
    let feeCents = 0;
    let paymentIntentId: string | null = null;

    if (session.payment_intent) {
      paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        amountCents = pi.amount_received || pi.amount || amountCents;
        feeCents = pi.application_fee_amount ?? 0;
      } catch (err) {
        logger.warn({ err, paymentIntentId }, 'Failed to retrieve PaymentIntent; using session amounts');
      }
    }

    await db
      .update(errandsTable)
      .set({
        paymentStatus: 'paid',
        paidAmount: (amountCents / 100).toFixed(2),
        platformFee: (feeCents / 100).toFixed(2),
        paymentIntentId,
        checkoutSessionId: session.id,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(errandsTable.id, errandId));

    logger.info({ errandId, sessionId: session.id, amountCents, feeCents }, 'Errand marked paid via webhook');
  }
}
