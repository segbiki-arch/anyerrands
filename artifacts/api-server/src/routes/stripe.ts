import { Router, type Request, type Response } from 'express';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripeClient';
import { db } from '@workspace/db';
import { errandsTable, helpersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

const PLATFORM_FEE_PERCENT = 10;

type HelperRow = typeof helpersTable.$inferSelect;

/**
 * Loads the helper for :helperId and verifies the logged-in user is allowed to
 * manage its payout/bank settings. Writes the appropriate error response and
 * returns null when access is denied. Payout settings are sensitive (they let
 * someone change where money is sent), so only the profile owner may touch them.
 */
async function requireOwnedHelper(req: Request, res: Response): Promise<HelperRow | null> {
  const helperId = parseInt(String(req.params.helperId), 10);
  if (isNaN(helperId)) {
    res.status(400).json({ error: 'Invalid helperId' });
    return null;
  }
  if (!req.user) {
    res.status(401).json({ error: 'You must be logged in to manage payout details' });
    return null;
  }

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, helperId));
  if (!helper) {
    res.status(404).json({ error: 'Helper not found' });
    return null;
  }

  // Payout settings can only be managed by the account that owns the profile.
  // Legacy profiles created before ownership existed (userId == null) cannot be
  // managed at all — there is no trustworthy way to prove who owns them, so we
  // never auto-claim based on a weak signal like a matching display name.
  if (helper.userId !== req.user.id) {
    res.status(403).json({ error: 'You do not have access to this helper account' });
    return null;
  }

  return helper;
}

router.get('/stripe/config', async (_req, res) => {
  const publishableKey = await getStripePublishableKey();
  return res.json({ publishableKey });
});

router.post('/stripe/connect/onboard/:helperId', async (req, res) => {
  const helper = await requireOwnedHelper(req, res);
  if (!helper) return;

  try {
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
        .where(eq(helpersTable.id, helper.id));
    }

    const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] ?? 'localhost'}`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${domain}/helpers/${helper.id}?connect=refresh`,
      return_url: `${domain}/helpers/${helper.id}?connect=success`,
      type: 'account_onboarding',
    });

    return res.json({ url: accountLink.url });
  } catch (err) {
    req.log.error({ err }, 'Stripe onboard error');
    return res.status(502).json({ error: 'Could not start bank setup. Please try again.' });
  }
});

router.post('/stripe/connect/manage/:helperId', async (req, res) => {
  const helper = await requireOwnedHelper(req, res);
  if (!helper) return;
  if (!helper.stripeAccountId) return res.status(400).json({ error: 'No connected account yet' });

  try {
    const stripe = await getUncachableStripeClient();
    const account = await stripe.accounts.retrieve(helper.stripeAccountId);

    const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] ?? 'localhost'}`;

    // Express accounts that have finished onboarding get a dashboard login link
    // (lets them change bank account, view payouts, etc.). If onboarding isn't
    // complete yet, fall back to an account link so they can finish setup.
    if (account.details_submitted) {
      const loginLink = await stripe.accounts.createLoginLink(helper.stripeAccountId);
      return res.json({ url: loginLink.url });
    }

    const accountLink = await stripe.accountLinks.create({
      account: helper.stripeAccountId,
      refresh_url: `${domain}/helpers/${helper.id}?connect=refresh`,
      return_url: `${domain}/helpers/${helper.id}?connect=success`,
      type: 'account_onboarding',
    });
    return res.json({ url: accountLink.url });
  } catch (err) {
    req.log.error({ err }, 'Stripe manage error');
    return res.status(502).json({ error: 'Could not open bank settings. Please try again.' });
  }
});

router.get('/stripe/connect/status/:helperId', async (req, res) => {
  const helper = await requireOwnedHelper(req, res);
  if (!helper) return;

  if (!helper.stripeAccountId) {
    return res.json({ connected: false, detailsSubmitted: false, chargesEnabled: false, accountId: null });
  }

  try {
    const stripe = await getUncachableStripeClient();
    const account = await stripe.accounts.retrieve(helper.stripeAccountId);

    return res.json({
      connected: true,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      accountId: helper.stripeAccountId,
    });
  } catch (err) {
    req.log.error({ err }, 'Stripe status error');
    return res.status(502).json({ error: 'Could not check account status. Please try again.' });
  }
});

router.post('/stripe/checkout', async (req, res) => {
  const { errandId, successPath, cancelPath } = req.body as {
    errandId?: number;
    successPath?: string;
    cancelPath?: string;
  };

  if (!errandId) return res.status(400).json({ error: 'errandId required' });

  // Paying requires login: the payer becomes the errand's requester of record,
  // and is then the ONLY person who can later confirm completion and release
  // the held payment to the helper.
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to pay for an errand.' });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, errandId));
  if (!errand) return res.status(404).json({ error: 'Errand not found' });
  if (!errand.budgetAmount) return res.status(400).json({ error: 'Errand has no budget set' });

  // Never charge twice for the same errand.
  if (errand.paymentStatus === 'paid') {
    return res.status(400).json({ error: 'This errand has already been paid for.' });
  }

  // Bind the errand to the paying user if it isn't already owned by someone else.
  if (errand.requesterUserId && errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: 'This errand belongs to another account.' });
  }

  const amountCents = Math.round(Number(errand.budgetAmount) * 100);
  if (amountCents < 50) return res.status(400).json({ error: 'Minimum payment is €0.50' });

  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);

  const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] ?? 'localhost'}`;
  const successUrl = `${domain}${successPath ?? '/errands'}?payment=success&errandId=${errandId}`;
  const cancelUrl = `${domain}${cancelPath ?? '/errands'}?payment=cancelled&errandId=${errandId}`;

  const stripe = await getUncachableStripeClient();

  // Verify the helper can receive a payout later, but do NOT transfer now.
  // Funds are held in the platform account (escrow) and only released to the
  // helper when the requester confirms completion via /errands/:id/complete.
  let helperCanReceive = false;
  if (errand.helperId) {
    const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, errand.helperId));
    if (helper?.stripeAccountId) {
      const account = await stripe.accounts.retrieve(helper.stripeAccountId);
      helperCanReceive = account.charges_enabled;
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

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Record the session ID so we can correlate the upcoming webhook even if
  // metadata is somehow stripped, and bind the errand to the paying user.
  await db.update(errandsTable)
    .set({
      checkoutSessionId: session.id,
      requesterUserId: errand.requesterUserId ?? req.user.id,
      updatedAt: new Date(),
    })
    .where(eq(errandsTable.id, errandId));

  return res.json({
    url: session.url,
    sessionId: session.id,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    helperReceives: helperCanReceive ? amountCents - platformFeeCents : null,
  });
});

export default router;
