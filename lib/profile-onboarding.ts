export type ProfileCompletionFields = {
  firstName: string;
  lastName: string;
  role: string;
  licenseNumber: string;
  roleOtherDescription: string;
  address: string;
  city: string;
  country: string;
};

export class ProfileCompletionError extends Error {
  constructor(public code: 'names_required' | 'license_required' | 'role_requires_contact') {
    super(code);
    this.name = 'ProfileCompletionError';
  }
}

export function profileRoleAction(currentRole: string, selectedRole: string): 'save' | 'apply' | 'contact' {
  if (selectedRole === currentRole || ['user', 'owner', 'viewer'].includes(selectedRole)) return 'save';
  return ['agent', 'broker'].includes(selectedRole) ? 'apply' : 'contact';
}

// Mirror the existing profile controller's self-service boundary. Professional
// applications never change the active role before the server reviews them.
export function profileCompletionPlan(currentRole: string, form: ProfileCompletionFields) {
  if (!form.firstName.trim() || !form.lastName.trim()) throw new ProfileCompletionError('names_required');
  const action = profileRoleAction(currentRole, form.role);
  const professionalApplication = action === 'apply';
  if (action === 'contact') {
    throw new ProfileCompletionError('role_requires_contact');
  }
  const license = form.licenseNumber.trim();
  if (['agent', 'broker', 'real_estate_office', 'lawyer', 'notary', 'legal_consultant'].includes(form.role) && !license) {
    throw new ProfileCompletionError('license_required');
  }
  const profile: Record<string, string> = {
    firstName: form.firstName,
    lastName: form.lastName,
    role: professionalApplication ? currentRole : form.role,
    address: form.address,
    city: form.city,
    country: form.country,
  };
  if (form.role === 'other') profile.roleOtherDescription = form.roleOtherDescription;
  if (!professionalApplication && ['agent', 'broker', 'real_estate_office'].includes(form.role)) {
    profile.agentLicenseNumber = license;
    if (form.role === 'broker' || form.role === 'real_estate_office') profile.falLicenseNumber = license;
  }
  if (['lawyer', 'notary', 'legal_consultant'].includes(form.role)) profile.lawLicenseNumber = license;
  return {
    profile,
    application: professionalApplication ? { requestedRole: form.role, falLicenseNumber: license } : undefined,
  };
}

type ProfileUpdateFields = {
  firstName: string;
  lastName?: string;
  role: string;
  roleOtherDescription?: string;
  brokerType?: string;
  falLicenseNumber?: string;
  falLicenseExpiry?: string;
  licenseIssueDate?: string;
  commercialRegistrationNumber?: string;
  lawLicenseNumber?: string;
  city?: string;
  country?: string;
};

// The regular profile form deliberately permits an empty last name.
export function profileUpdatePlan(currentRole: string, fields: ProfileUpdateFields) {
  if (!fields.firstName.trim()) throw new ProfileCompletionError('names_required');
  const action = profileRoleAction(currentRole, fields.role);
  if (action === 'contact') throw new ProfileCompletionError('role_requires_contact');
  const license = fields.falLicenseNumber?.trim();
  if (action === 'apply' && !license) throw new ProfileCompletionError('license_required');
  const profile: Record<string, string> = {};
  for (const key of ['firstName', 'lastName', 'roleOtherDescription', 'brokerType', 'falLicenseNumber', 'falLicenseExpiry', 'licenseIssueDate', 'commercialRegistrationNumber', 'lawLicenseNumber', 'city', 'country'] as const) {
    const value = fields[key];
    if (typeof value !== 'string') continue;
    if ((key === 'falLicenseExpiry' || key === 'licenseIssueDate') && !value) continue;
    profile[key] = value;
  }
  profile.role = action === 'apply' ? currentRole : fields.role;
  return {
    profile,
    application: action === 'apply' ? { requestedRole: fields.role, falLicenseNumber: license! } : undefined,
  };
}
