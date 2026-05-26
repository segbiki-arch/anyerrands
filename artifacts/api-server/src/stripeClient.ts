import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (hostname && xReplitToken) {
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
    const targetEnvironment = isProduction ? 'production' : 'development';
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', 'stripe');
    url.searchParams.set('environment', targetEnvironment);

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken },
    });

    if (response.ok) {
      const data = await response.json() as { items?: Array<{ settings?: { publishable?: string; secret?: string } }> };
      const settings = data.items?.[0]?.settings;
      if (settings?.secret && settings?.publishable) {
        return { secretKey: settings.secret, publishableKey: settings.publishable };
      }
    }
  }

  // Fall back to environment secrets
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    throw new Error('Stripe credentials not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.');
  }
  return { secretKey, publishableKey };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: '2025-06-30.basil' as any });
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL required');
  const { secretKey } = await getCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  });
}
