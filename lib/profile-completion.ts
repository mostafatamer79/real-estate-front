import { Role, User } from '@/types/user';

/**
 * Single source of truth for "does this user still need to complete their
 * profile?". Used by PageWrapper (route guard) and useAuth. Keep the rules
 * in sync with what the /profile form actually collects:
 * - firstName (the profile form only has one name field — lastName is NOT
 *   required here or users get stuck in a redirect loop)
 * - a license number for broker/agent/office roles
 */
export function needsProfileCompletion(user: Partial<User> | null | undefined): boolean {
  if (!user || user.role === Role.ADMIN) return false;

  const isProfileComplete = !!user.firstName;

  const licenseRoles: Role[] = [Role.AGENT, Role.BROKER, Role.REAL_ESTATE_OFFICE];
  const isBrokerWithoutLicense =
    licenseRoles.includes(user.role as Role) &&
    !user.agentLicenseNumber &&
    !user.falLicenseNumber;

  return !isProfileComplete || isBrokerWithoutLicense;
}
