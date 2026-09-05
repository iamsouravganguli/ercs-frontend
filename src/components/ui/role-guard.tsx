"use client";

interface RoleGuardProps {
  userRole?: string | null;
  roles: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function hasRole(
  userRole?: string | null,
  roles?: string | string[],
): boolean {
  if (!userRole || !roles) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(userRole);
}

export function RoleGuard({
  userRole,
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  if (!hasRole(userRole, roles)) return <>{fallback}</>;
  return <>{children}</>;
}
