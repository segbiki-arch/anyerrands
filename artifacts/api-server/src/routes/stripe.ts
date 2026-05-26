import { Router } from 'express';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripeClient';
import { db } from '@workspace/db';
import { errandsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

// Return the publishable key so the frontend can initialise Stripe.js
router.get('/stripe/config', async (_req, res) => {
  const publishableKey = await getStripePublishableKey();
  return res.json({ publishableKey });
});

// Create a Stripe Checkout session for an errand payment
// Called when a requester wants to pay for an accepted errand
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

  const domain = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] ?? 'localhost'}`;
  const successUrl = `${domain}${successPath ?? '/errands'}?payment=success&errandId=${errandId}`;
  const cancelUrl = `${domain}${cancelPath ?? '/errands'}?payment=cancelled&errandId=${errandId}`;

  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.create({
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
  });

  return res.json({ url: session.url, sessionId: session.id });
});

export default router;
