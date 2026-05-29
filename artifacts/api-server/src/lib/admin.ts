/**
 * Admin access is controlled by an email allowlist in the ADMIN_EMAILS
 * environment variable (comma-separated). This lets the owner add or remove
 * admins without code changes. Matching is case-insensitive.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
