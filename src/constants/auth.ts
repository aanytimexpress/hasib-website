const ADMIN_EMAIL_ALLOWLIST = ["aanytime.xpress@gmail.com", "alshakib730@gmail.com"] as const;

export const ADMIN_ALLOWLIST_EMAILS = [...ADMIN_EMAIL_ALLOWLIST];

const ADMIN_ALLOWLIST_SET = new Set(ADMIN_EMAIL_ALLOWLIST.map((email) => email.toLowerCase()));

export function isAllowlistedAdminEmail(email: string): boolean {
  return ADMIN_ALLOWLIST_SET.has(email.trim().toLowerCase());
}
