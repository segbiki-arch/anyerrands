import { randomInt } from "node:crypto";

// A 4-digit completion code (1000-9999) shown only to the requester. The helper
// must enter it to complete a paid errand and release the held payout, so it acts
// as the requester's act of completion + satisfaction + payout authorisation.
export function generateCompletionPin(): string {
  return String(randomInt(1000, 10000));
}
