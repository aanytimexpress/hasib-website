import { RoleName } from "../types/models";

export const ADMIN_ROLES: RoleName[] = ["super_admin", "editor", "moderator"];

export function isAdminRole(role: RoleName | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}
