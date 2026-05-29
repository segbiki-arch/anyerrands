import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getUncachableStripeClient, getStripePublishableKey } from './stripeClient';
import app from "./app";
import { logger } from "./lib/logger";
import { ensureDefaultCategories } from "./lib/seedCategories";

async function checkStripeMode() {
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  try {
    const pk = await getStripePublishableKey();
    const mode = pk.startsWith('pk_live_') ? 'LIVE' : pk.startsWith('pk_test_') ? 'TEST' : 'UNKNOWN';
    logger.info({ mode, isProduction }, 'Stripe credentials verified');
    if (isProduction && mode !== 'LIVE') {
      logger.error({ mode }, 'WARNING: Production deployment is using non-LIVE Stripe keys. Real payments will NOT process.');
    }
  } catch (err) {
    logger.error({ err }, 'Stripe credential check failed');
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL required for Stripe');

  try {
    await runMigrations({ databaseUrl });
    logger.info('Stripe schema ready');

    const stripeSync = await getStripeSync();

    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    if (domain) {
      const webhookUrl = `https://${domain}/api/stripe/webhook`;
      await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      logger.info({ webhookUrl }, 'Stripe webhook configured');
    }

    // Sync existing Stripe data in the background — don't block startup
    stripeSync.syncBackfill()
      .then(() => logger.info('Stripe backfill complete'))
      .catch((err: Error) => logger.error({ err }, 'Stripe backfill error'));
  } catch (err) {
    logger.error({ err }, 'Stripe init failed — payments unavailable');
    // Non-fatal: app still starts, payments just won't work
  }
}

await initStripe();
await checkStripeMode();

try {
  await ensureDefaultCategories();
} catch (err) {
  logger.error({ err }, "Category seed failed");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
