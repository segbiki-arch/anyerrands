import { type helpersTable } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";

type HelperRow = typeof helpersTable.$inferSelect;

/**
 * Returns true only when the helper has a connected Stripe account that can
 * actually receive charges/transfers. Used to block accepting PAID errands
 * before payout is set up, so the requester's money and the platform fee are
 * routed correctly instead of landing entirely in the platform account.
 */
export async function isHelperChargesEnabled(helper: HelperRow): Promise<boolean> {
  if (!helper.stripeAccountId) return false;
  const stripe = await getUncachableStripeClient();
  const account = await stripe.accounts.retrieve(helper.stripeAccountId);
  return account.charges_enabled === true;
}
