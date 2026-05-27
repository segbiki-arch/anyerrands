import { Router } from 'express';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripeClient';
import { db } from '@workspace/db';
import { errandsTable, helpersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

const PLATFORM_FEE_PERCENT = 10;

router.get('/stripe/config', async (_req, res) => {
  const publishableKey = await getStripePublishableKey();
  return res.json({ publishableKey });
});

router.post('/stripe/connect/onboard/:helperId', async (req, res) => {
  const helperId = parseInt(req.params.helperId, 10);
  if (isNaN(helperId)) return res.status(400).json({ error: 'Invalid helperId' });

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, helperId));
  if (!helper) return res.status(404).json({ error: 'Helper not found' });

  const stripe = await getUncachableStripeClient();

  let accountId = helper.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IE',
      capabilities: { transfers: { requested: true } },
      business_profile: { name: helper.name },
    });
    accountId = account.id;
    await db.update(helpersTable)
      .set({ stripeAccountId: accountId })
      .where(eq(helpersTable.id, helperId));
  }

  const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] ?? 'localhost'}`;
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${domain}/helpers/${helperId}?connect=refresh`,
    return_url: `${domain}/helpers/${helperId}?connect=success`,
    type: 'account_onboarding',
  });

  return res.json({ url: accountLink.url });
});

router.get('/stripe/connect/status/:helperId', async (req, res) => {
  const helperId = parseInt(req.params.helperId, 10);
  if (isNaN(helperId)) return res.status(400).json({ error: 'Invalid helperId' });

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, helperId));
  if (!helper) return res.status(404).json({ error: 'Helper not found' });

  if (!helper.stripeAccountId) {
    return res.json({ connected: false, detailsSubmitted: false, chargesEnabled: false, accountId: null });
  }

  const stripe = await getUncachableStripeClient();
  const account = await stripe.accounts.retrieve(helper.stripeAccountId);

  return res.json({
    connected: true,
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    accountId: helper.stripeAccountId,
  });
});

router.post('/stripe/checkout', async (req, res) => {
  const { errandId, successPath, cancelPath } = req.body as {
    errandId?: number;
    successPath?: string;
    cancelPath?: string;
  };

  if (!errandId) return res.status(400).json({ error: 'errandId required' });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, errandId));
  if (!errand) return res.status(404).json({ error: 'Errand not found' });
  if (!errand.budgetAmount) return res.status(400).json({ error: 'Errand has no budget set' });

  const amountCents = Math.round(Number(errand.budgetAmount) * 100);
  if (amountCents < 50) return res.status(400).json({ error: 'Minimum payment is €0.50' });

  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);

  const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] ?? 'localhost'}`;
  const successUrl = `${domain}${successPath ?? '/errands'}?payment=success&errandId=${errandId}`;
  const cancelUrl = `${domain}${cancelPath ?? '/errands'}?payment=cancelled&errandId=${errandId}`;

  const stripe = await getUncachableStripeClient();

  let helperStripeAccountId: string | null = null;
  if (errand.helperId) {
    const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, errand.helperId));
    if (helper?.stripeAccountId) {
      const account = await stripe.accounts.retrieve(helper.stripeAccountId);
      if (account.charges_enabled) {
        helperStripeAccountId = helper.stripeAccountId;
      }
    }
  }

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: amountCents,
          product_data: {
            name: errand.title,
            description: `Errand by ${errand.requesterName} in ${errand.requesterLocation}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      errandId: String(errandId),
      errandTitle: errand.title,
      helperName: errand.helperName ?? '',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  if (helperStripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: helperStripeAccountId },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Record the session ID so we can correlate the upcoming webhook even if
  // metadata is somehow stripped.
  await db.update(errandsTable)
    .set({ checkoutSessionId: session.id, updatedAt: new Date() })
    .where(eq(errandsTable.id, errandId));

  return res.json({
    url: session.url,
    sessionId: session.id,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    helperReceives: helperStripeAccountId ? amountCents - platformFeeCents : null,
  });
});

export default router;
