import type { UserRole } from "../types/User";

export const ADMIN_MANAGEMENT: UserRole[] = ["superadmin", "admin"];
export const ORDER_FINANCIAL: UserRole[] = ["superadmin", "admin", "financial"];
export const ORDER_MANAGEMENT: UserRole[] = ["superadmin", "admin"];
export const ORDER_SHIPPING: UserRole[] = ["superadmin", "admin", "shipper"];
export const ORDER_DELIVERY: UserRole[] = ["superadmin", "admin", "delivery"];

export function hasRole(
  userRole: UserRole | undefined | null,
  allowedRoles: UserRole[],
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function canManageAdmin(role?: UserRole | null): boolean {
  return hasRole(role, ADMIN_MANAGEMENT);
}

export function canAccessFinancial(role?: UserRole | null): boolean {
  return hasRole(role, ORDER_FINANCIAL);
}

export function canManageOrders(role?: UserRole | null): boolean {
  return hasRole(role, ORDER_MANAGEMENT);
}

export function canShipOrders(role?: UserRole | null): boolean {
  return hasRole(role, ORDER_SHIPPING);
}

export function canDeliverOrders(role?: UserRole | null): boolean {
  return hasRole(role, ORDER_DELIVERY);
}
